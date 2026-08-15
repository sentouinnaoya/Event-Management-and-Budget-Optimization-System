package com.embos.controller;

import com.embos.dto.GuestDtos;
import com.embos.service.GuestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/events/{token}")
@RequiredArgsConstructor
public class PublicEventController {

    private final GuestService guestService;

    @GetMapping
    public ResponseEntity<GuestDtos.PublicEventResponse> get(@PathVariable String token) {
        return ResponseEntity.ok(guestService.publicEvent(token));
    }

    @PostMapping("/register")
    public ResponseEntity<GuestDtos.Response> register(
            @PathVariable String token,
            @Valid @RequestBody GuestDtos.PublicRegistrationRequest request) {
        return ResponseEntity.ok(guestService.registerPublic(token, request));
    }
}
