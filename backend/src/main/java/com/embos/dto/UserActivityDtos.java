package com.embos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class UserActivityDtos {

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            String role,
            LocalDateTime createdAt,
            long eventCount,
            long guestCount,
            long taskCount,
            BigDecimal expenseTotal,
            long auditLogCount,
            long unreadNotifications) {
    }

    public record EventStatusCount(
            String status,
            long count) {
    }

    public record RecentAuditEntry(
            String action,
            String entityType,
            String entityName,
            LocalDateTime createdAt) {
    }

    public record UserDetail(
            Long id,
            String fullName,
            String email,
            String role,
            LocalDateTime createdAt,
            long eventCount,
            List<EventStatusCount> eventBreakdown,
            long guestCount,
            long taskCount,
            long tasksDone,
            BigDecimal expenseTotal,
            long auditLogCount,
            long totalNotifications,
            long unreadNotifications,
            List<RecentAuditEntry> recentAuditLogs) {
    }

    private UserActivityDtos() {
    }
}
