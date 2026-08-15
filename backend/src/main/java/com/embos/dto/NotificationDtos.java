package com.embos.dto;

import java.time.LocalDateTime;

public final class NotificationDtos {

    public record Response(
            Long id,
            Long eventId,
            String type,
            String title,
            String message,
            boolean read,
            LocalDateTime createdAt) {
    }

    public record UnreadCount(long count) {
    }

    private NotificationDtos() {
    }
}
