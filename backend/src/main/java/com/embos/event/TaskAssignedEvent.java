package com.embos.event;

public record TaskAssignedEvent(
        Long eventId,
        Long recipientId,
        String eventName,
        String taskTitle,
        String assigneeName) {
}
