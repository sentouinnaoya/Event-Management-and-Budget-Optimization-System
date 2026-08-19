package com.embos.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class AuditLogDtos {

    public record Response(
            Long id,
            Long userId,
            String userName,
            String userRole,
            String action,
            String entityType,
            Long entityId,
            String entityName,
            String details,
            LocalDateTime createdAt) {
    }

    public record PageResponse(
            List<Response> content,
            int page,
            int size,
            long totalElements,
            int totalPages) {
    }

    public record Stats(
            long totalLogs,
            long todayLogs,
            List<ActionCount> topActions,
            List<UserCount> topUsers) {
    }

    public record ActionCount(String action, long count) {
    }

    public record UserCount(Long userId, String userName, long count) {
    }

    private AuditLogDtos() {
    }
}
