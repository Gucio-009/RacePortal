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
            String imageUrl
    ) {
    }

    public record CarUpdateRequest(
            @Size(min = 1, max = 60) String make,
            @Size(min = 1, max = 60) String model,
            @Min(1950) @Max(2100) Integer year,
            @Size(max = 60) String className,
            @Size(max = 20) String plate,
            String imageUrl
    ) {
    }
}
