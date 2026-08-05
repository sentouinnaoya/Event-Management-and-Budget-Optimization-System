package com.embos.controller;

import com.embos.dto.VendorDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.VendorService;
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
@RequestMapping("/api/events/{eventId}/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final EventService eventService;
    private final VendorService vendorService;

    @GetMapping
    public ResponseEntity<List<VendorDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(vendorService.list(event));
    }

    @PostMapping
    public ResponseEntity<VendorDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody VendorDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.create(event, request));
    }

    @PutMapping("/{vendorId}")
    public ResponseEntity<VendorDtos.Response> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long vendorId,
            @Valid @RequestBody VendorDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(vendorService.update(event, vendorId, request));
    }

    @DeleteMapping("/{vendorId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long vendorId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        vendorService.delete(event, vendorId);
        return ResponseEntity.noContent().build();
    }
}
