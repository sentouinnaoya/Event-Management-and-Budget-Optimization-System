package com.embos.event;

public record RecoveryPointRestoredEvent(
        Long eventId,
        Long recipientId,
        String eventName,
        Long restoredEventId) {
}
