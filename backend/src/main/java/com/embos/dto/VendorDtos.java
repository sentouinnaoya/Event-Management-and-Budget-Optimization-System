package com.embos.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class VendorDtos {

    public record Request(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 100) String serviceType,
            @Size(max = 150) String contactPerson,
            @Email @Size(max = 150) String email,
            @Size(max = 50) String phone,
            @DecimalMin("0.0") BigDecimal assignedAmount,
            @NotBlank String status) {
    }

    public record Response(
            Long id,
            String name,
            String serviceType,
            String contactPerson,
            String email,
            String phone,
            BigDecimal assignedAmount,
            String status) {
    }

    private VendorDtos() {
    }
}
