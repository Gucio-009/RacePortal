package pl.raceportal.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO klas zawodów w ramach wydarzenia.
 */
public final class EventClassDtos {

    private EventClassDtos() {
    }

    public record EventClassResponse(
            String id,
            String eventId,
            String name,
            int sortOrder,
            Integer minEngineCc,
            Integer maxEngineCc,
            BigDecimal turboMultiplier,
            BigDecimal superchargerMultiplier,
            String allowedDriveTypes,
            Boolean requireCage,
            Boolean requireRegistered,
            String allowedTireTypes,
            BigDecimal maxHpPerTonne,
            String createdAt,
            String updatedAt
    ) {
    }

    public record EventClassUpsertRequest(
            @NotBlank @Size(min = 1, max = 80) String name,
            @Min(0) @Max(10_000) Integer sortOrder,
            @Min(0) @Max(100_000) Integer minEngineCc,
            @Min(0) @Max(100_000) Integer maxEngineCc,
            @DecimalMin("0.1") @DecimalMax("10") BigDecimal turboMultiplier,
            @DecimalMin("0.1") @DecimalMax("10") BigDecimal superchargerMultiplier,
            @Size(max = 40) String allowedDriveTypes,
            Boolean requireCage,
            Boolean requireRegistered,
            @Size(max = 200) String allowedTireTypes,
            @DecimalMin("1") @DecimalMax("2000") BigDecimal maxHpPerTonne
    ) {
    }

    public record AutoAssignResult(
            int total,
            int assigned,
            int unassigned
    ) {
    }

    public record BulkClassAssignRequest(
            @NotBlank String classId,
            List<@NotBlank String> registrationIds
    ) {
    }
}
