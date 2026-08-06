package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO ścieżki organizatora (wniosek o rolę).
 * <p>
 * Rola w architekturze: body {@code POST /api/organizer/apply}.
 * Technologie: Bean Validation.
 * </p>
 * Pomysł (alt): załączniki (NIP, dokumenty) w osobnym storage.
 */
public final class OrganizerDtos {

    private OrganizerDtos() {
    }

    /** Wniosek USER → ORGANIZER: firma + uzasadnienie. */
    public record ApplyRequest(
            @NotBlank @Size(min = 2, max = 120) String company,
            @NotBlank @Size(min = 10, max = 2000) String message
    ) {
    }
}
