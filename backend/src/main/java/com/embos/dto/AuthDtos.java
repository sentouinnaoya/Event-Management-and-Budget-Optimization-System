package com.embos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AuthDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 6, max = 100)
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "Password must include at least one letter, one number, and one symbol") String password) {
    }

    public record AuthResponse(
            String token,
            Long id,
            String fullName,
            String email,
            String role) {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String role,
            LocalDateTime createdAt) {
    }

    private AuthDtos() {
    }
}
