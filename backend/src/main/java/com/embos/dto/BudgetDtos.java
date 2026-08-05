package com.embos.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class BudgetDtos {

    public record CategoryRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull @DecimalMin("0.0") BigDecimal allocatedAmount,
            @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal alertThresholdPct) {
    }

    public record CategoryResponse(
            Long id,
            String name,
            BigDecimal allocatedAmount,
            BigDecimal alertThresholdPct,
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

    private BudgetDtos() {
    }
}
