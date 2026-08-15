package com.embos.controller;

import com.embos.dto.EventDtos;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(eventService.list(principal.user(), status));
    }

    @PostMapping
    public ResponseEntity<EventDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @Valid @RequestBody EventDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.create(principal.user(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDtos.Response> get(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(eventService.get(id, principal.user()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDtos.Response> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id,
            @Valid @RequestBody EventDtos.Request request) {
        return ResponseEntity.ok(eventService.update(id, principal.user(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id) {
        eventService.delete(id, principal.user());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<EventDtos.Response> publish(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(eventService.publish(id, principal.user()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EventDtos.Response> changeStatus(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id,
            @Valid @RequestBody EventDtos.StatusRequest request) {
        return ResponseEntity.ok(eventService.changeStatus(id, principal.user(), request.status(), request.reason()));
    }
}
