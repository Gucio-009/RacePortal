package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class OrganizerDtos {

    private OrganizerDtos() {
    }

    public record ApplyRequest(
            @NotBlank @Size(min = 2, max = 120) String company,
            @NotBlank @Size(min = 10, max = 2000) String message
    ) {
    }
}
