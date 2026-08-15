package com.embos.controller;

import com.embos.dto.GuestDtos;
import com.embos.service.GuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/events")
@RequiredArgsConstructor
public class PublicEventsController {

    private final GuestService guestService;

    @GetMapping
    public ResponseEntity<List<GuestDtos.PublicEventResponse>> list() {
        return ResponseEntity.ok(guestService.listPublic());
    }
}
