package com.embos.controller;

import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events/{eventId}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final EventService eventService;
    private final ReportService reportService;

    @GetMapping("/{type}")
    public ResponseEntity<Object> report(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable String type) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(reportService.report(event, type));
    }
}
