package com.embos.controller;

import com.embos.dto.BudgetDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.BudgetService;
import com.embos.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events/{eventId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final EventService eventService;
    private final BudgetService budgetService;

    @GetMapping("/summary")
    public ResponseEntity<BudgetDtos.SummaryResponse> summary(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(budgetService.summary(event));
    }
}
