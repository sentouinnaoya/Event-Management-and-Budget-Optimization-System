package com.embos.event;

public record GuestRegisteredEvent(
        Long eventId,
        Long recipientId,
        String eventName,
        String guestName,
        String guestEmail) {
}
