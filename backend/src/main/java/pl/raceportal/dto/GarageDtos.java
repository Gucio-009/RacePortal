package pl.raceportal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class GarageDtos {

    private GarageDtos() {
    }

    public record CarResponse(
            String id,
            String userId,
            String make,
            String model,
            Integer year,
            String className,
            String plate,
            String imageUrl,
            String driveType,
            Integer powerHp,
            Integer engineCc,
            Integer weightKg,
            boolean registered,
            String registrationType,
            String kssNumber,
            boolean hasRollCage,
            boolean hasOc,
            boolean hasPt,
            String socialUrl,
            String videoUrl,
            String modifications,
            String createdAt,
            String updatedAt
    ) {
    }

    public record CarCreateRequest(
            @NotBlank @Size(min = 1, max = 60) String make,
            @NotBlank @Size(min = 1, max = 60) String model,
            @Min(1950) @Max(2100) Integer year,
            @Size(max = 60) String className,
            @Size(max = 20) String plate,
            String imageUrl,
            @Size(max = 10) String driveType,
            @Min(1) @Max(5000) Integer powerHp,
            @Min(1) @Max(20000) Integer engineCc,
            @Min(1) @Max(10000) Integer weightKg,
            Boolean registered,
            @Size(max = 20) String registrationType,
            @Size(max = 40) String kssNumber,
            Boolean hasRollCage,
            Boolean hasOc,
            Boolean hasPt,
            @Size(max = 500) String socialUrl,
            @Size(max = 500) String videoUrl,
            @Size(max = 5000) String modifications
    ) {
    }

    public record CarUpdateRequest(
            @Size(min = 1, max = 60) String make,
            @Size(min = 1, max = 60) String model,
            @Min(1950) @Max(2100) Integer year,
            @Size(max = 60) String className,
            @Size(max = 20) String plate,
            String imageUrl,
            @Size(max = 10) String driveType,
            @Min(1) @Max(5000) Integer powerHp,
            @Min(1) @Max(20000) Integer engineCc,
            @Min(1) @Max(10000) Integer weightKg,
            Boolean registered,
            @Size(max = 20) String registrationType,
            @Size(max = 40) String kssNumber,
            Boolean hasRollCage,
            Boolean hasOc,
            Boolean hasPt,
            @Size(max = 500) String socialUrl,
            @Size(max = 500) String videoUrl,
            @Size(max = 5000) String modifications
    ) {
    }
}
