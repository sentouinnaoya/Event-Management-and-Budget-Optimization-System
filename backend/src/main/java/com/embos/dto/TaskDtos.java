package com.embos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class TaskDtos {

    public record Request(
            @NotBlank @Size(max = 200) String title,
            String description,
            Long assignedStaffId,
            LocalDate dueDate,
            @NotBlank String priority,
            @NotBlank String status) {
    }

    public record Response(
            Long id,
            String title,
            String description,
            Long assignedStaffId,
            String assignedStaffName,
            LocalDate dueDate,
            String priority,
            String status,
            LocalDateTime completedAt) {
    }

    public record StatusRequest(
            @NotBlank String status) {
    }

    private TaskDtos() {
    }
}
