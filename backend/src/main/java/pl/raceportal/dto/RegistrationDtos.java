package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.GarageDtos.CarResponse;

public final class RegistrationDtos {

    private RegistrationDtos() {
    }

    public record UserRef(String id, String username, String email, String avatar) {
    }

    public record RegistrationCreateRequest(
            @NotBlank String eventId,
            String carId,
            @Size(max = 500) String note
    ) {
    }

    public record RegistrationStatusUpdateRequest(
            @NotBlank String status,
            @Size(max = 500) String comment
    ) {
    }

    public record PaymentProofRequest(
            @NotBlank @Size(max = 500) String paymentProofUrl
    ) {
    }

    public record RegistrationResponse(
            String id,
            String userId,
            String eventId,
            String carId,
            String status,
            String note,
            String organizerComment,
            String paymentProofUrl,
            String paymentDueAt,
            String createdAt,
            String updatedAt,
            EventResponse event,
            CarResponse car,
            UserRef user
    ) {
    }
}
