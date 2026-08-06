package com.embos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class EventDtos {

    public record Request(
            @NotBlank @Size(max = 200) String name,
            String description,
            @NotNull LocalDate date,
            @Min(1) Integer durationInDays,
            @NotBlank @Size(max = 200) String venue,
            @NotNull @Min(1) Integer capacity,
            LocalDate registrationDeadline) {
    }

    public record Response(
            Long id,
            String name,
            String description,
            LocalDate date,
            Integer durationInDays,
            String venue,
            Integer capacity,
            LocalDate registrationDeadline,
            String status,
            String registrationToken,
            String organizerName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record StatusRequest(
            @NotBlank String status) {
    }

    private EventDtos() {
    }
}
