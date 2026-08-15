package com.embos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class GuestDtos {

    public record Request(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @Size(max = 50) String phone,
            @NotBlank String guestType) {
    }

    public record Response(
            Long id,
            String name,
            String email,
            String phone,
            String guestType,
            String status,
            String registrationCode,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record StatusRequest(
            @NotBlank String status) {
    }

    public record PublicEventResponse(
            Long id,
            String name,
            String description,
            LocalDate date,
            String venue,
            Integer capacity,
            LocalDate registrationDeadline,
            String status,
            long registeredCount,
            String registrationToken) {
    }

    public record PublicRegistrationRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @Size(max = 50) String phone) {
    }

    private GuestDtos() {
    }
}
