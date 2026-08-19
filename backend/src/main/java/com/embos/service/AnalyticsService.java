package com.embos.service;

import com.embos.dto.AnalyticsDtos;
import com.embos.entity.AuditLog;
import com.embos.entity.enums.EventStatus;
import com.embos.entity.enums.GuestStatus;
import com.embos.entity.enums.TaskStatus;
import com.embos.repository.AuditLogRepository;
import com.embos.repository.BudgetCategoryRepository;
import com.embos.repository.EventRepository;
import com.embos.repository.ExpenseRepository;
import com.embos.repository.GuestRepository;
import com.embos.repository.TaskRepository;
import com.embos.repository.UserRepository;
import com.embos.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final GuestRepository guestRepository;
    private final TaskRepository taskRepository;
    private final ExpenseRepository expenseRepository;
    private final VendorRepository vendorRepository;
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public AnalyticsDtos.Response getAnalytics() {
        return new AnalyticsDtos.Response(
                buildOverview(),
                buildEventBreakdown(),
                buildFinancial(),
                buildGuestAnalytics(),
                buildTaskHealth(),
                buildTopUsers(),
                buildRecentEvents(),
                buildRecentGuests());
    }

    private AnalyticsDtos.Overview buildOverview() {
        LocalDateTime todayMidnight = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowMidnight = LocalDate.now().plusDays(1).atStartOfDay();

        return new AnalyticsDtos.Overview(
                eventRepository.count(),
                userRepository.count(),
                userRepository.countByCreatedAtBetween(todayMidnight, tomorrowMidnight),
                guestRepository.countAll(),
                vendorRepository.countAll(),
                taskRepository.countAll());
    }

    private AnalyticsDtos.EventBreakdown buildEventBreakdown() {
        return new AnalyticsDtos.EventBreakdown(
                eventRepository.countByStatus(EventStatus.DRAFT),
                eventRepository.countByStatus(EventStatus.PUBLISHED),
                eventRepository.countByStatus(EventStatus.ONGOING),
                eventRepository.countByStatus(EventStatus.SUSPENDED),
                eventRepository.countByStatus(EventStatus.COMPLETED),
                eventRepository.countByStatus(EventStatus.FAILED),
                eventRepository.countByStatus(EventStatus.ARCHIVED));
    }

    private AnalyticsDtos.FinancialOverview buildFinancial() {
        BigDecimal allocated = budgetCategoryRepository.sumAllocatedAll();
        BigDecimal spent = expenseRepository.sumAmountAll();
        return new AnalyticsDtos.FinancialOverview(
                allocated,
                spent,
                allocated.subtract(spent),
                expenseRepository.countPending(),
                expenseRepository.count());
    }

    private AnalyticsDtos.GuestAnalytics buildGuestAnalytics() {
        return new AnalyticsDtos.GuestAnalytics(
                guestRepository.countAll(),
                guestRepository.countByStatus(GuestStatus.REGISTERED),
                guestRepository.countByStatus(GuestStatus.APPROVED),
                guestRepository.countByStatus(GuestStatus.REJECTED),
                guestRepository.countByStatus(GuestStatus.ATTENDED),
                guestRepository.countByStatus(GuestStatus.ABSENT));
    }

    private AnalyticsDtos.TaskHealth buildTaskHealth() {
        return new AnalyticsDtos.TaskHealth(
                taskRepository.countAll(),
                taskRepository.countByStatus(TaskStatus.TODO),
                taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
                taskRepository.countByStatus(TaskStatus.DONE),
                taskRepository.countOverdue(LocalDate.now()));
    }

    private List<AnalyticsDtos.ActivityUser> buildTopUsers() {
        List<AuditLog> logs = auditLogRepository.findAll();
        Map<Long, Map<String, Long>> userActions = logs.stream()
                .collect(Collectors.groupingBy(
                        AuditLog::getUserId,
                        Collectors.groupingBy(
                                AuditLog::getUserName,
                                Collectors.counting())));
        return userActions.entrySet().stream()
                .flatMap(e -> e.getValue().entrySet().stream()
                        .map(ne -> new AnalyticsDtos.ActivityUser(e.getKey(), ne.getKey(), ne.getValue())))
                .sorted((a, b) -> Long.compare(b.actionCount(), a.actionCount()))
                .limit(10)
                .toList();
    }

    private List<AnalyticsDtos.DailyCount> buildRecentEvents() {
        List<AnalyticsDtos.DailyCount> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();
            long count = eventRepository.countByCreatedAtBetween(start, end);
            result.add(new AnalyticsDtos.DailyCount(
                    date.format(DateTimeFormatter.ISO_LOCAL_DATE), count));
        }
        return result;
    }

    private List<AnalyticsDtos.DailyCount> buildRecentGuests() {
        List<AnalyticsDtos.DailyCount> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long count = guestRepository.countByCreatedAtBetween(
                    date.atStartOfDay(), date.plusDays(1).atStartOfDay());
            result.add(new AnalyticsDtos.DailyCount(
                    date.format(DateTimeFormatter.ISO_LOCAL_DATE), count));
        }
        return result;
    }
}
