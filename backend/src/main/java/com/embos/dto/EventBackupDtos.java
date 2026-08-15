package com.embos.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class EventBackupDtos {

    public record Request(
            String backupVenue,
            LocalDate backupDate,
            Integer backupCapacity,
            @DecimalMin("0.00") BigDecimal contingencyBudget,
            String backupVendors,
            String notes) {
    }

    public record Response(
            Long id,
            String backupVenue,
            LocalDate backupDate,
            Integer backupCapacity,
            BigDecimal contingencyBudget,
            String backupVendors,
            String notes,
            LocalDate updatedAt) {
    }

    private EventBackupDtos() {
    }
}
