package com.embos.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AnalyticsDtos {

    public record Response(
            Overview overview,
            EventBreakdown eventBreakdown,
            FinancialOverview financial,
            GuestAnalytics guests,
            TaskHealth tasks,
            List<ActivityUser> topUsers,
            List<DailyCount> recentEvents,
            List<DailyCount> recentGuests
    ) {
    }

    public record Overview(
            long totalEvents,
            long totalUsers,
            long todayUsers,
            long totalGuests,
            long totalVendors,
            long totalTasks
    ) {
    }

    public record EventBreakdown(
            long draft,
            long published,
            long ongoing,
            long suspended,
            long completed,
            long failed,
            long archived
    ) {
    }

    public record FinancialOverview(
            BigDecimal totalAllocated,
            BigDecimal totalSpent,
            BigDecimal totalRemaining,
            long pendingExpenses,
            long totalExpenses
    ) {
    }

    public record GuestAnalytics(
            long total,
            long registered,
            long approved,
            long rejected,
            long attended,
            long absent
    ) {
    }

    public record TaskHealth(
            long total,
            long todo,
            long inProgress,
            long done,
            long overdue
    ) {
    }

    public record ActivityUser(
            Long userId,
            String userName,
            long actionCount
    ) {
    }

    public record DailyCount(
            String date,
            long count
    ) {
    }

    private AnalyticsDtos() {
    }
}
