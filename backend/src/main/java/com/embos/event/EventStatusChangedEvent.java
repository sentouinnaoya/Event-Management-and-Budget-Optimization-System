package com.embos.event;

public record EventStatusChangedEvent(
        Long eventId,
        Long recipientId,
        String eventName,
        String fromStatus,
        String toStatus,
        String reason) {
}
