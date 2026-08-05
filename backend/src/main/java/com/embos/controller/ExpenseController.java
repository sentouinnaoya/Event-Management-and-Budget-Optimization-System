package com.embos.controller;

import com.embos.dto.ExpenseDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final EventService eventService;
    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(expenseService.list(event));
    }

    @PostMapping
    public ResponseEntity<ExpenseDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody ExpenseDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.create(event, request));
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseDtos.Response> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long expenseId,
            @Valid @RequestBody ExpenseDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(expenseService.update(event, expenseId, request));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long expenseId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        expenseService.delete(event, expenseId);
        return ResponseEntity.noContent().build();
    }
}
