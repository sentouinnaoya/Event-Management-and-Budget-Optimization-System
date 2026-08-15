package com.embos.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class AiDtos {

    public record InsightOption(String label, String description, String estimatedImpact) {
    }

    public record Insight(
            String topic,
            String severity,
            String summary,
            List<InsightOption> options,
            String recommendedOption,
            String impactEstimate) {
    }

    public record InsightsResponse(
            List<Insight> insights,
            Integer actionCount,
            LocalDateTime generatedAt,
            boolean generating) {
    }

    private AiDtos() {
    }
}
