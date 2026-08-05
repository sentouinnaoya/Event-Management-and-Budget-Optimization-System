package com.embos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class StaffDtos {

    public record Request(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 150) String responsibility,
            @Size(max = 50) String phone) {
    }

    public record Response(
            Long id,
            String name,
            String responsibility,
            String phone) {
    }

    private StaffDtos() {
    }
}
