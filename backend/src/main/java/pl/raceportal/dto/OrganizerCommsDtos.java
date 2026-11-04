package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class OrganizerCommsDtos {

    private OrganizerCommsDtos() {
    }

    public record BroadcastRequest(
            /** Filtr statusów (puste = wszyscy poza CANCELED). */
            List<String> statuses,
            /** Opcjonalny filtr klasy zawodów. */
            String classId,
            @NotBlank @Size(max = 160) String subject,
            @NotBlank @Size(max = 5000) String body,
            boolean sendEmail,
            boolean sendInApp
    ) {
    }

    public record BroadcastResult(
            int recipients,
            int emailed,
            int notified
    ) {
    }
}
