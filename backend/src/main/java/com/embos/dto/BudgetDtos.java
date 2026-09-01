package com.embos.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class BudgetDtos {

    public record CategoryRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull @DecimalMin("0.0") BigDecimal allocatedAmount,
            @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal alertThresholdPct,
            @NotNull @Min(1) @Max(5) Integer priority) {
    }

    public record CategoryResponse(
            Long id,
            String name,
            BigDecimal allocatedAmount,
            BigDecimal alertThresholdPct,
            Integer priority,
            BigDecimal spentAmount,
            BigDecimal remainingAmount,
            BigDecimal utilizationPct,
            String alertLevel) {
    }

    public record SummaryResponse(
            BigDecimal totalAllocated,
            BigDecimal totalSpent,
            BigDecimal totalRemaining,
            List<CategoryResponse> categories,
            List<String> recommendations) {
    }

    public record OptimizeRequest(
            @DecimalMin("0.0") BigDecimal totalBudget) {
    }

    public record OptimizationCategory(
            Long categoryId,
            String name,
            Integer priority,
            BigDecimal currentAllocation,
            BigDecimal spentAmount,
            BigDecimal requiredAmount,
            BigDecimal suggestedAllocation,
            BigDecimal deltaAmount,
            BigDecimal coveragePct,
            String rationale) {
    }

    public record OptimizationResponse(
            String status,
            BigDecimal totalBudget,
            BigDecimal totalCurrentAllocation,
            BigDecimal totalRequired,
            BigDecimal totalSuggested,
            List<OptimizationCategory> categories,
            List<String> notes) {
    }

    public record ApplyOptimizationRequest(
            @NotNull List<AppliedAllocation> allocations) {
    }

    public record AppliedAllocation(
            @NotNull Long categoryId,
            @NotNull @DecimalMin("0.0") BigDecimal suggestedAllocation) {
    }

    private BudgetDtos() {
    }
}
