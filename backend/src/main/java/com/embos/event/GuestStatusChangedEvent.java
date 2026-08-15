package com.embos.event;

import java.time.LocalDate;

public record GuestStatusChangedEvent(
        Long eventId,
        Long guestId,
        String guestName,
        String guestEmail,
        String eventName,
        String registrationToken,
        String registrationCode,
        String newStatus,
        LocalDate eventDate,
        String eventVenue) {
}
