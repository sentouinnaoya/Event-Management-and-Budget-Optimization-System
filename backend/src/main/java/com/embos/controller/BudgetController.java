package com.embos.controller;

import com.embos.dto.BudgetDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.BudgetOptimizerService;
import com.embos.service.BudgetService;
import com.embos.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/events/{eventId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final EventService eventService;
    private final BudgetService budgetService;
    private final BudgetOptimizerService optimizerService;

    @GetMapping("/summary")
    public ResponseEntity<BudgetDtos.SummaryResponse> summary(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(budgetService.summary(event));
    }

    @PostMapping("/optimize")
    public ResponseEntity<BudgetDtos.OptimizationResponse> optimize(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @RequestBody(required = false) BudgetDtos.OptimizeRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        BigDecimal totalBudget = request == null ? null : request.totalBudget();
        return ResponseEntity.ok(optimizerService.optimize(event, totalBudget));
    }

    @PostMapping("/optimize/apply")
    public ResponseEntity<BudgetDtos.SummaryResponse> apply(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody BudgetDtos.ApplyOptimizationRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(optimizerService.apply(event, request.allocations(), principal.getUsername()));
    }
}
