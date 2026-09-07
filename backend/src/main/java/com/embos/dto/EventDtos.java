package com.embos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public final class EventDtos {

    public record Request(
            @NotBlank @Size(max = 200) String name,
            String description,
            @NotNull LocalDate date,
            @Min(1) Integer durationInDays,
            @NotBlank @Size(max = 200) String venue,
            @NotNull @Min(1) Integer capacity,
            LocalDate registrationDeadline,
            @Size(max = 50) String eventType,
            LocalTime startTime,
            LocalTime endTime,
            @Size(max = 150) String contactEmail,
            @Size(max = 500) String address) {
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
            String eventType,
            LocalTime startTime,
            LocalTime endTime,
            String contactEmail,
            String address,
            String status,
            String registrationToken,
            String organizerName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record StatusRequest(
            @NotBlank String status,
            String reason) {
    }

    private EventDtos() {
    }
}
