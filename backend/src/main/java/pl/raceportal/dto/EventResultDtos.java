package pl.raceportal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class EventResultDtos {

    private EventResultDtos() {
    }

    public record EventResultResponse(
            String id,
            String eventId,
            String registrationId,
            String userId,
            String driverName,
            String carLabel,
            String classId,
            String className,
            Integer startNumber,
            Integer position,
            Long timeMs,
            String timeDisplay,
            Integer points,
            String status,
            String note,
            String updatedAt
    ) {
    }

    public record EventResultUpsertRequest(
            @NotBlank String registrationId,
            @Min(1) @Max(9999) Integer startNumber,
            @Min(1) @Max(9999) Integer position,
            String timeDisplay,
            @Min(0) @Max(1_000_000) Integer points,
            @Size(max = 10) String status,
            @Size(max = 500) String note
    ) {
    }

    public record PointsRuleResponse(
            String id,
            String eventId,
            int place,
            int points
    ) {
    }

    public record PointsRuleItem(
            @Min(1) @Max(100) int place,
            @Min(0) @Max(10000) int points
    ) {
    }

    public record PointsRulesReplaceRequest(
            List<PointsRuleItem> rules
    ) {
    }

    public record PublishResultsRequest(
            boolean published
    ) {
    }

    public record RecalcResult(
            int updated
    ) {
    }
}
