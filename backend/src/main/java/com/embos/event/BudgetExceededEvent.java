package com.embos.event;

import java.math.BigDecimal;

public record BudgetExceededEvent(
        Long eventId,
        Long recipientId,
        String eventName,
        String categoryName,
        BigDecimal categoryOvershoot,
        BigDecimal eventOvershoot) {
}
