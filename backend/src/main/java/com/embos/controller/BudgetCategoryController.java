package com.embos.controller;

import com.embos.dto.BudgetDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.BudgetService;
import com.embos.service.EventService;
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
@RequestMapping("/api/events/{eventId}/budget-categories")
@RequiredArgsConstructor
public class BudgetCategoryController {

    private final EventService eventService;
    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetDtos.CategoryResponse>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(budgetService.listCategories(event));
    }

    @PostMapping
    public ResponseEntity<BudgetDtos.CategoryResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody BudgetDtos.CategoryRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(budgetService.addCategory(event, request));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<BudgetDtos.CategoryResponse> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long categoryId,
            @Valid @RequestBody BudgetDtos.CategoryRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(budgetService.updateCategory(event, categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long categoryId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        budgetService.deleteCategory(event, categoryId);
        return ResponseEntity.noContent().build();
    }
}
