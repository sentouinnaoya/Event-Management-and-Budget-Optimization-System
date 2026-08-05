package com.embos.controller;

import com.embos.dto.DashboardDtos;
import com.embos.security.AppUserDetails;
import com.embos.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardDtos.Response> dashboard(
            @AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(dashboardService.dashboard(principal.user()));
    }
}
