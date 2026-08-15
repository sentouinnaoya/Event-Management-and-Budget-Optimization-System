package com.embos.controller;

import com.embos.dto.AiDtos;
import com.embos.dto.BudgetDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.AiAdvisorService;
import com.embos.service.BudgetService;
import com.embos.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@RestController
@RequestMapping("/api/events/{eventId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final ExecutorService aiExecutor = Executors.newFixedThreadPool(2);

    private final EventService eventService;
    private final BudgetService budgetService;
    private final AiAdvisorService aiAdvisorService;

    @GetMapping("/summary")
    public ResponseEntity<BudgetDtos.SummaryResponse> summary(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(budgetService.summary(event));
    }

    @GetMapping("/insights")
    public ResponseEntity<AiDtos.InsightsResponse> insights(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(aiAdvisorService.getLatest(event));
    }

    @PostMapping("/insights")
    public ResponseEntity<AiDtos.InsightsResponse> generate(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        if (!aiAdvisorService.markGenerating(event.getId())) {
            return ResponseEntity.ok(aiAdvisorService.getLatest(event));
        }
        AiDtos.InsightsResponse snapshot = aiAdvisorService.getLatest(event);
        try {
            aiExecutor.submit(() -> {
                try {
                    aiAdvisorService.generate(event);
                } catch (Exception e) {
                    log.error("Async AI generation failed for event {}", event.getId(), e);
                } finally {
                    aiAdvisorService.clearGenerating(event.getId());
                }
            });
        } catch (Exception e) {
            aiAdvisorService.clearGenerating(event.getId());
            throw e;
        }
        return ResponseEntity.ok(new AiDtos.InsightsResponse(
                snapshot.insights(), snapshot.actionCount(), snapshot.generatedAt(), true));
    }
}
