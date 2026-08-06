package com.embos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ReportDtos {

    public record SummaryReport(
            EventDtos.Response event,
            long totalGuests,
            long approvedGuests,
            long vendorCount,
            long staffCount,
            long taskCount,
            long tasksDone,
            BigDecimal totalAllocated,
            BigDecimal totalSpent,
            BigDecimal totalRemaining) {
    }

    public record ExpenseReport(
            List<ExpenseDtos.Response> expenses,
            BigDecimal totalSpent,
            BigDecimal totalPaid,
            BigDecimal totalPending) {
    }

    public record VendorReport(
            List<VendorDtos.Response> vendors,
            BigDecimal totalAssigned) {
    }

    public record StaffReport(
            List<StaffDtos.Response> staff,
            long totalTasks,
            long tasksDone) {
    }

    public record AttendanceReport(
            long total,
            long registered,
            long approved,
            long rejected,
            long attended,
            long absent,
            Map<String, Long> byType) {
    }

    public record DailyDay(
            int day,
            LocalDate date,
            BigDecimal totalSpent,
            long registered,
            long tasksCreated,
            long tasksDue,
            long tasksCompleted,
            long vendorsAdded) {
    }

    public record DailyOverview(
            EventDtos.Response event,
            int totalDays,
            List<DailyDay> days) {
    }

    public record DailyReport(
            EventDtos.Response event,
            LocalDate date,
            int day,
            int totalDays,
            List<ExpenseDtos.Response> expenses,
            BigDecimal totalSpent,
            long expenseCount,
            long registered,
            long approved,
            long attended,
            long absent,
            long rejected,
            long tasksCreated,
            long tasksDue,
            long tasksCompleted,
            long vendorsAdded) {
    }

    private ReportDtos() {
    }
}
