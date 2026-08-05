package com.embos.controller;

import com.embos.dto.StaffDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.StaffService;
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
@RequestMapping("/api/events/{eventId}/staff")
@RequiredArgsConstructor
public class StaffController {

    private final EventService eventService;
    private final StaffService staffService;

    @GetMapping
    public ResponseEntity<List<StaffDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(staffService.list(event));
    }

    @PostMapping
    public ResponseEntity<StaffDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody StaffDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.create(event, request));
    }

    @PutMapping("/{staffId}")
    public ResponseEntity<StaffDtos.Response> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long staffId,
            @Valid @RequestBody StaffDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(staffService.update(event, staffId, request));
    }

    @DeleteMapping("/{staffId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long staffId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        staffService.delete(event, staffId);
        return ResponseEntity.noContent().build();
    }
}
