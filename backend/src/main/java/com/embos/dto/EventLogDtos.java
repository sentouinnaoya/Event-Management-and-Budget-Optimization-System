package com.embos.dto;

import java.time.LocalDateTime;

public final class EventLogDtos {

    public record Response(
            Long id,
            String action,
            String message,
            String actor,
            LocalDateTime createdAt) {
    }

    private EventLogDtos() {
    }
}
