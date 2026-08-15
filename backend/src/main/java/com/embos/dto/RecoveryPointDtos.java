package com.embos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class RecoveryPointDtos {

    public record CreateRequest(
            @NotBlank @Size(max = 150) String label) {
    }

    public record Response(
            Long id,
            String label,
            Long restoredEventId,
            LocalDateTime restoredAt,
            LocalDateTime createdAt) {
    }

    private RecoveryPointDtos() {
    }
}
