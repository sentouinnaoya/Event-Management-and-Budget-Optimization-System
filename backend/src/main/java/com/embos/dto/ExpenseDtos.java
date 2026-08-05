package com.embos.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class ExpenseDtos {

    public record Request(
            @NotBlank @Size(max = 255) String description,
            @NotNull Long categoryId,
            Long vendorId,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotNull LocalDate expenseDate,
            @NotBlank String paymentStatus) {
    }

    public record Response(
            Long id,
            String description,
            Long categoryId,
            String categoryName,
            Long vendorId,
            String vendorName,
            BigDecimal amount,
            LocalDate expenseDate,
            String paymentStatus) {
    }

    private ExpenseDtos() {
    }
}
