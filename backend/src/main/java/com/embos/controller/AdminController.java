package com.embos.controller;

import com.embos.dto.AnalyticsDtos;
import com.embos.dto.AuditLogDtos;
import com.embos.dto.AuthDtos;
import com.embos.dto.UserActivityDtos;
import com.embos.entity.User;
import com.embos.entity.enums.UserRole;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.UserMapper;
import com.embos.repository.UserRepository;
import com.embos.service.AnalyticsService;
import com.embos.service.AuditLogService;
import com.embos.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuditLogService auditLogService;
    private final AnalyticsService analyticsService;
    private final UserActivityService userActivityService;

    @GetMapping("/users")
    public ResponseEntity<List<AuthDtos.UserResponse>> users() {
        return ResponseEntity.ok(userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(userMapper::toResponse)
                .toList());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AuthDtos.UserResponse> changeRole(@PathVariable Long id, Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String role = body.get("role");
        if (role == null || role.isBlank()) {
            throw new BadRequestException("Role is required");
        }
        user.setRole(UserRole.valueOf(role.toUpperCase()));
        return ResponseEntity.ok(userMapper.toResponse(userRepository.save(user)));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<AuditLogDtos.PageResponse> auditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(auditLogService.list(page, size, action, entityType, userId));
    }

    @GetMapping("/audit-logs/stats")
    public ResponseEntity<AuditLogDtos.Stats> auditLogStats() {
        return ResponseEntity.ok(auditLogService.stats());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDtos.Response> analytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    @GetMapping("/users/activity")
    public ResponseEntity<List<UserActivityDtos.UserSummary>> userActivityList() {
        return ResponseEntity.ok(userActivityService.listSummaries());
    }

    @GetMapping("/users/{id}/activity")
    public ResponseEntity<UserActivityDtos.UserDetail> userActivityDetail(@PathVariable Long id) {
        return ResponseEntity.ok(userActivityService.getDetail(id));
    }
}
