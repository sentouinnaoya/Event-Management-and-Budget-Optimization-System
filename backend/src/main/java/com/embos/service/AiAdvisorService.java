package com.embos.service;

import com.embos.ai.JsonExtract;
import com.embos.ai.OpenRouterClient;
import com.embos.dto.AiDtos;
import com.embos.dto.BudgetDtos;
import com.embos.entity.Event;
import com.embos.entity.EventAiInsight;
import com.embos.entity.EventLog;
import com.embos.entity.Expense;
import com.embos.entity.Vendor;
import com.embos.entity.enums.EventStatus;
import com.embos.entity.enums.GuestStatus;
import com.embos.repository.EventAiInsightRepository;
import com.embos.repository.EventLogRepository;
import com.embos.repository.EventRepository;
import com.embos.repository.ExpenseRepository;
import com.embos.repository.GuestRepository;
import com.embos.repository.VendorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAdvisorService {

    private static final int MAX_INSIGHTS = 5;
    private static final int MAX_OPTIONS = 3;
    private static final long AUTO_REFRESH_MIN_MILLIS = 20_000L;

    private static final List<String> BUDGET_ACTIONS = List.of(
            "EXPENSE_CREATED", "EXPENSE_UPDATED", "EXPENSE_DELETED",
            "VENDOR_CREATED", "VENDOR_UPDATED", "VENDOR_DELETED",
            "BUDGET_CATEGORY_CREATED", "BUDGET_CATEGORY_UPDATED", "BUDGET_CATEGORY_DELETED",
            "GUEST_APPROVED", "GUEST_REJECTED");

    private final BudgetService budgetService;
    private final ExpenseRepository expenseRepository;
    private final VendorRepository vendorRepository;
    private final GuestRepository guestRepository;
    private final EventLogRepository eventLogRepository;
    private final EventRepository eventRepository;
    private final EventAiInsightRepository aiInsightRepository;
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    private final Set<Long> generating = ConcurrentHashMap.newKeySet();
    private final Set<Long> refreshPending = ConcurrentHashMap.newKeySet();
    private final Set<Long> deferredArmed = ConcurrentHashMap.newKeySet();
    private final Map<Long, Long> lastAutoRefreshAt = new ConcurrentHashMap<>();
    private final ExecutorService aiExecutor = Executors.newFixedThreadPool(2);
    private final ScheduledExecutorService janitor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "ai-refresh-janitor");
        t.setDaemon(true);
        return t;
    });

    public boolean isGenerating(Long eventId) {
        return generating.contains(eventId);
    }

    public boolean markGenerating(Long eventId) {
        return generating.add(eventId);
    }

    public void clearGenerating(Long eventId) {
        generating.remove(eventId);
    }

    public void generateNow(Event event) {
        startRun(event, false);
    }

    public void autoRefresh(Event event) {
        if (event == null) {
            return;
        }
        Long eventId = event.getId();
        long now = System.currentTimeMillis();
        if (now - lastAutoRefreshAt.getOrDefault(eventId, 0L) < AUTO_REFRESH_MIN_MILLIS) {
            refreshPending.add(eventId);
            armDeferred(eventId);
            return;
        }
        startRun(event, true);
    }

    private void startRun(Event event, boolean auto) {
        Long eventId = event.getId();
        if (!markGenerating(eventId)) {
            refreshPending.add(eventId);
            armDeferred(eventId);
            return;
        }
        if (auto) {
            lastAutoRefreshAt.put(eventId, System.currentTimeMillis());
        }
        aiExecutor.submit(() -> {
            try {
                TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
                txTemplate.executeWithoutResult(status -> generate(event));
            } catch (Exception e) {
                log.error("Async AI generation failed for event {}", eventId, e);
            } finally {
                clearGenerating(eventId);
                if (refreshPending.remove(eventId)) {
                    startRun(event, false);
                }
            }
        });
    }

    private void armDeferred(Long eventId) {
        if (!deferredArmed.add(eventId)) {
            return;
        }
        janitor.schedule(() -> {
            deferredArmed.remove(eventId);
            if (!refreshPending.contains(eventId)) {
                return;
            }
            eventRepository.findById(eventId).ifPresent(this::autoRefresh);
        }, AUTO_REFRESH_MIN_MILLIS, TimeUnit.MILLISECONDS);
    }

    public static void scheduleAfterCommit(ObjectProvider<AiAdvisorService> provider, Event event) {
        if (event == null) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    AiAdvisorService service = provider.getIfAvailable();
                    if (service != null) {
                        service.autoRefresh(event);
                    }
                }
            });
        } else {
            AiAdvisorService service = provider.getIfAvailable();
            if (service != null) {
                service.autoRefresh(event);
            }
        }
    }

    @Transactional(readOnly = true)
    public AiDtos.InsightsResponse getLatest(Event event) {
        AiDtos.InsightsResponse stored = aiInsightRepository.findByEventId(event.getId())
                .map(this::toResponse)
                .orElse(new AiDtos.InsightsResponse(List.of(), 0, null, false));
        return new AiDtos.InsightsResponse(
                stored.insights(), stored.actionCount(), stored.generatedAt(), isGenerating(event.getId()));
    }

    @Transactional
    public AiDtos.InsightsResponse generate(Event event) {
        List<EventLog> actions = eventLogRepository.findAllByEventIdOrderByCreatedAtDesc(event.getId()).stream()
                .filter(log -> BUDGET_ACTIONS.contains(log.getAction()))
                .limit(20)
                .toList();
        if (!hasBudgetData(event, actions)) {
            return new AiDtos.InsightsResponse(List.of(), 0, null, false);
        }

        List<AiDtos.Insight> insights = askLlm(event, actions);
        if (insights.isEmpty()) {
            insights = fallbackInsights(event);
        }
        insights = insights.subList(0, Math.min(insights.size(), MAX_INSIGHTS));

        EventAiInsight existing = aiInsightRepository.findByEventId(event.getId()).orElse(null);
        if (existing == null) {
            existing = EventAiInsight.builder().event(event).build();
        }
        existing.setPayload(write(insights));
        existing.setActionCount(actions.size());
        existing.setGeneratedAt(LocalDateTime.now());
        aiInsightRepository.save(existing);

        return new AiDtos.InsightsResponse(insights, actions.size(), existing.getGeneratedAt(), false);
    }

    private boolean hasBudgetData(Event event, List<EventLog> actions) {
        if (!actions.isEmpty()) {
            return true;
        }
        if (!budgetService.summary(event).categories().isEmpty()) {
            return true;
        }
        if (!vendorRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).isEmpty()) {
            return true;
        }
        return !expenseRepository.findAllByEventId(event.getId()).isEmpty();
    }

    private List<AiDtos.Insight> askLlm(Event event, List<EventLog> actions) {
        String systemPrompt = """
                You are a budget optimization analyst for the EMBOS event management platform. \
                You analyze an organizer's budget-related decisions and the event's current financial state. \
                Respond ONLY with a JSON object with this exact shape: \
                {"insights": [{"topic": string, "severity": "INFO"|"WARNING"|"CRITICAL", "summary": string, \
                "options": [{"label": string, "description": string, "estimatedImpact": string}], \
                "recommendedOption": string, "impactEstimate": string}]}
                Focus on: vendor cost comparisons within the same service type, budget reallocation between \
                categories, overspend recovery, and savings opportunities. Provide exactly 2 insights, each with \
                2 concrete alternative options. Use ONLY the provided data; never invent vendors, categories, \
                prices, or numbers. Keep summaries under 150 characters. estimatedImpact states the expected \
                financial effect in one short sentence.""";
        String userPrompt = "Here is the event snapshot (JSON):\n" + snapshot(event, actions).toPrettyString();
        Optional<String> content = openRouterClient.chatJson(systemPrompt, userPrompt);
        List<AiDtos.Insight> parsed = content.map(this::parseInsights).orElse(List.of());
        if (content.isPresent() && parsed.isEmpty()) {
            String raw = content.get();
            log.warn("OpenRouter returned JSON with no usable insights (snapshot chars {}, raw chars {}): {}",
                    userPrompt.length(), raw.length(), raw.length() > 2000 ? raw.substring(0, 2000) : raw);
        }
        return parsed;
    }

    private ObjectNode snapshot(Event event, List<EventLog> actions) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("eventName", event.getName());
        root.put("eventDate", event.getDate().toString());
        root.put("venue", event.getVenue());
        root.put("capacity", event.getCapacity());
        root.put("status", event.getStatus().name());

        BudgetDtos.SummaryResponse summary = budgetService.summary(event);
        root.put("totalAllocated", summary.totalAllocated().toPlainString());
        root.put("totalSpent", summary.totalSpent().toPlainString());
        root.put("totalRemaining", summary.totalRemaining().toPlainString());

        ArrayNode categories = root.putArray("categories");
        for (BudgetDtos.CategoryResponse c : summary.categories()) {
            ObjectNode node = categories.addObject();
            node.put("name", c.name());
            node.put("allocated", c.allocatedAmount().toPlainString());
            node.put("spent", c.spentAmount().toPlainString());
            node.put("remaining", c.remainingAmount().toPlainString());
            node.put("utilizationPct", c.utilizationPct().toPlainString());
            node.put("alertLevel", c.alertLevel());
        }

        List<Expense> expenses = expenseRepository.findAllByEventId(event.getId()).stream()
                .sorted(Comparator.comparing(Expense::getExpenseDate).reversed())
                .limit(15)
                .toList();
        Map<Long, BigDecimal> vendorSpent = new HashMap<>();
        for (Expense e : expenseRepository.findAllByEventId(event.getId())) {
            if (e.getVendor() != null) {
                vendorSpent.merge(e.getVendor().getId(), e.getAmount(), BigDecimal::add);
            }
        }

        ArrayNode vendors = root.putArray("vendors");
        for (Vendor v : vendorRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId())) {
            ObjectNode node = vendors.addObject();
            node.put("name", v.getName());
            node.put("serviceType", v.getServiceType());
            node.put("assignedAmount", v.getAssignedAmount() == null ? "0" : v.getAssignedAmount().toPlainString());
            node.put("status", v.getStatus().name());
            node.put("spentAmount", vendorSpent.getOrDefault(v.getId(), BigDecimal.ZERO).toPlainString());
        }

        ArrayNode expenseList = root.putArray("expenses");
        for (Expense e : expenses) {
            ObjectNode node = expenseList.addObject();
            node.put("description", e.getDescription());
            node.put("category", e.getCategory().getName());
            if (e.getVendor() != null) {
                node.put("vendor", e.getVendor().getName());
            }
            node.put("amount", e.getAmount().toPlainString());
            node.put("date", e.getExpenseDate().toString());
            node.put("paymentStatus", e.getPaymentStatus().name());
        }

        ArrayNode guestCounts = root.putArray("guestCounts");
        for (GuestStatus s : GuestStatus.values()) {
            long count = guestRepository.countByEventIdAndStatus(event.getId(), s);
            if (count > 0) {
                guestCounts.addObject().put("status", s.name()).put("count", count);
            }
        }

        ArrayNode actionList = root.putArray("organizerActions");
        for (EventLog log : actions) {
            ObjectNode node = actionList.addObject();
            node.put("action", log.getAction());
            node.put("message", log.getMessage());
            node.put("actor", log.getActor());
            node.put("at", log.getCreatedAt().toString());
        }

        return root;
    }

    private List<AiDtos.Insight> parseInsights(String json) {
        try {
            JsonNode root = objectMapper.readTree(JsonExtract.findObject(objectMapper, json, "insights"));
            JsonNode insights = root.path("insights");
            if (!insights.isArray()) {
                return List.of();
            }
            List<AiDtos.Insight> result = new ArrayList<>();
            for (JsonNode node : insights) {
                if (!node.isObject() || result.size() >= MAX_INSIGHTS) {
                    continue;
                }
                String topic = clamp(node.path("topic").asText(""), 150);
                String summary = clamp(node.path("summary").asText(""), 250);
                if (topic.isBlank() && summary.isBlank()) {
                    continue;
                }
                String recommended = clamp(node.path("recommendedOption").asText(""), 150);
                String impact = clamp(node.path("impactEstimate").asText(""), 250);
                List<AiDtos.InsightOption> options = new ArrayList<>();
                JsonNode opts = node.path("options");
                if (opts.isArray()) {
                    for (JsonNode o : opts) {
                        if (!o.isObject() || options.size() >= MAX_OPTIONS) {
                            continue;
                        }
                        options.add(new AiDtos.InsightOption(
                                clamp(o.path("label").asText(""), 150),
                                clamp(o.path("description").asText(""), 400),
                                clamp(o.path("estimatedImpact").asText(""), 200)));
                    }
                }
                result.add(new AiDtos.Insight(topic, normalizeSeverity(node.path("severity").asText("INFO")),
                        summary, options, recommended, impact));
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse OpenRouter insights response", e);
            return List.of();
        }
    }

    private List<AiDtos.Insight> fallbackInsights(Event event) {
        List<AiDtos.Insight> insights = new ArrayList<>();
        BudgetDtos.SummaryResponse summary = budgetService.summary(event);
        for (BudgetDtos.CategoryResponse c : summary.categories()) {
            if (insights.size() >= MAX_INSIGHTS) {
                break;
            }
            if ("EXCEEDED".equals(c.alertLevel())) {
                insights.add(new AiDtos.Insight(
                        "Category over budget: " + c.name(), "CRITICAL",
                        "Category '" + c.name() + "' exceeded its allocation of " + c.allocatedAmount().toPlainString()
                                + " by " + c.remainingAmount().negate().toPlainString() + ".",
                        List.of(
                                new AiDtos.InsightOption("Reduce scope",
                                        "Cut or postpone non-essential spending in this category.",
                                        "Brings spending back under the allocation"),
                                new AiDtos.InsightOption("Reallocate from under-utilized categories",
                                        "Move budget from categories that are well below their allocation.",
                                        "Balances the overall budget without extra funding"),
                                new AiDtos.InsightOption("Renegotiate with vendors",
                                        "Ask current vendors to adjust pricing or payment terms.",
                                        "Lowers committed cost immediately")),
                        "Reallocate from under-utilized categories",
                        "Brings total spending within the allocated budget"));
            } else if ("WARNING".equals(c.alertLevel())) {
                insights.add(new AiDtos.Insight(
                        "Approaching budget limit: " + c.name(), "WARNING",
                        "Category '" + c.name() + "' is at " + c.utilizationPct().toPlainString()
                                + "% of its allocation. Consider pausing spending.",
                        List.of(
                                new AiDtos.InsightOption("Pause spending",
                                        "Hold new expenses in this category until usage drops.",
                                        "Prevents exceeding the allocation"),
                                new AiDtos.InsightOption("Increase allocation",
                                        "Shift budget from categories with surplus.",
                                        "Provides headroom for planned expenses")),
                        "Pause spending",
                        "Prevents exceeding the allocation"));
            }
        }

        if (insights.size() < MAX_INSIGHTS) {
            addVendorCostFallback(event, insights);
        }

        if (insights.isEmpty()) {
            if (event.getStatus() == EventStatus.DRAFT) {
                insights.add(new AiDtos.Insight(
                        "Plan your budget early", "INFO",
                        "No budget issues detected yet. Set realistic allocations per category and compare vendor quotes "
                                + "within the same service type before committing.",
                        List.of(
                                new AiDtos.InsightOption("Set category allocations",
                                        "Allocate budget to each planned category with a warning threshold.",
                                        "Keeps spending predictable"),
                                new AiDtos.InsightOption("Collect competing quotes",
                                        "Request quotes from multiple vendors per service type.",
                                        "Lowers procurement cost")),
                        "Set category allocations",
                        "Keeps spending predictable"));
            } else {
                insights.add(new AiDtos.Insight(
                        "Budget on track", "INFO",
                        "Your budget currently has " + summary.totalRemaining().toPlainString()
                                + " remaining of " + summary.totalAllocated().toPlainString()
                                + " allocated. Review vendor quotes and category usage to keep spending efficient.",
                        List.of(
                                new AiDtos.InsightOption("Review vendor quotes",
                                        "Compare quotes within each service type before renewing contracts.",
                                        "Identifies potential cost savings"),
                                new AiDtos.InsightOption("Set category alerts",
                                        "Ensure each category has a warning threshold to catch overspend early.",
                                        "Prevents budget surprises"),
                                new AiDtos.InsightOption("Track upcoming expenses",
                                        "Log planned expenses ahead of time to keep utilization accurate.",
                                        "Improves forecast accuracy")),
                        "Review vendor quotes",
                        "Identifies potential cost savings"));
            }
        }
        return insights;
    }

    private void addVendorCostFallback(Event event, List<AiDtos.Insight> insights) {
        Map<String, List<Vendor>> byType = vendorRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .collect(java.util.stream.Collectors.groupingBy(v -> v.getServiceType().toLowerCase(Locale.ROOT)));
        for (Map.Entry<String, List<Vendor>> entry : byType.entrySet()) {
            if (insights.size() >= MAX_INSIGHTS) {
                break;
            }
            List<Vendor> priced = entry.getValue().stream()
                    .filter(v -> v.getAssignedAmount() != null)
                    .toList();
            if (priced.size() < 2) {
                continue;
            }
            Vendor expensive = priced.stream().max(Comparator.comparing(Vendor::getAssignedAmount)).orElse(null);
            Vendor cheapest = priced.stream().min(Comparator.comparing(Vendor::getAssignedAmount)).orElse(null);
            if (expensive == null || cheapest == null || expensive.equals(cheapest)
                    || expensive.getAssignedAmount().compareTo(cheapest.getAssignedAmount()) <= 0) {
                continue;
            }
            BigDecimal savings = expensive.getAssignedAmount().subtract(cheapest.getAssignedAmount());
            insights.add(new AiDtos.Insight(
                    "Cost-saving vendor option: " + expensive.getName(), "WARNING",
                    expensive.getName() + " is assigned " + expensive.getAssignedAmount().toPlainString()
                            + " for " + entry.getKey() + ", while " + cheapest.getName()
                            + " is assigned " + cheapest.getAssignedAmount().toPlainString() + ".",
                    List.of(
                            new AiDtos.InsightOption("Switch to the cheaper vendor",
                                    "Replace " + expensive.getName() + " with " + cheapest.getName()
                                            + " for " + entry.getKey() + ".",
                                    "Saves up to " + savings.toPlainString()),
                            new AiDtos.InsightOption("Negotiate price",
                                    "Ask " + expensive.getName() + " to match the lower rate.",
                                    "Reduces cost without changing vendors")),
                    "Switch to the cheaper vendor",
                    "Saves up to " + savings.toPlainString()));
        }
    }

    private String normalizeSeverity(String value) {
        return switch (value.toUpperCase(Locale.ROOT)) {
            case "CRITICAL", "WARNING" -> value.toUpperCase(Locale.ROOT);
            default -> "INFO";
        };
    }

    private String clamp(String value, int max) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim().replaceAll("[\\p{Cntrl}&&[^\\t\\n\\r]]", "");
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }

    private String write(List<AiDtos.Insight> insights) {
        try {
            return objectMapper.writeValueAsString(insights);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize AI insights", e);
        }
    }

    private List<AiDtos.Insight> read(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<AiDtos.Insight>>() {
            });
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse stored AI insights", e);
            return List.of();
        }
    }

    private AiDtos.InsightsResponse toResponse(EventAiInsight stored) {
        return new AiDtos.InsightsResponse(read(stored.getPayload()), stored.getActionCount(), stored.getGeneratedAt(), false);
    }
}
