package com.embos.dto;

import java.math.BigDecimal;
import java.util.List;

public final class DashboardDtos {

    public record Response(
            int totalEvents,
            int draftEvents,
            int publishedEvents,
            int ongoingEvents,
            int completedEvents,
            int archivedEvents,
            long totalGuests,
            BigDecimal totalAllocated,
            BigDecimal totalSpent,
            List<EventDtos.Response> recentEvents) {
    }

    private DashboardDtos() {
    }
}
