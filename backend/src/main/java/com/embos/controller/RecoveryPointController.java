package com.embos.controller;

import com.embos.dto.EventDtos;
import com.embos.dto.RecoveryPointDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.RecoveryPointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/recovery-points")
@RequiredArgsConstructor
public class RecoveryPointController {

    private final EventService eventService;
    private final RecoveryPointService recoveryPointService;

    @GetMapping
    public ResponseEntity<List<RecoveryPointDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(recoveryPointService.list(event));
    }

    @PostMapping
    public ResponseEntity<RecoveryPointDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody RecoveryPointDtos.CreateRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recoveryPointService.create(event, request.label(), principal.user().getFullName()));
    }

    @PostMapping("/{recoveryPointId}/restore")
    public ResponseEntity<EventDtos.Response> restore(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long recoveryPointId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(
                recoveryPointService.restore(event, recoveryPointId, principal.user().getFullName()));
    }

    @DeleteMapping("/{recoveryPointId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long recoveryPointId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        recoveryPointService.delete(event, recoveryPointId, principal.user().getFullName());
        return ResponseEntity.noContent().build();
    }
}
