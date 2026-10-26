package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.GarageDtos.CarResponse;

/**
 * DTO zgłoszeń na wydarzenia — create, status, dowód płatności, odpowiedź zagnieżdżona.
 * <p>
 * Rola w architekturze: kontrakt {@code RegistrationController}; {@code status} mapowany
 * przez logikę płatności w serwisie; {@code paymentProofUrl} / {@code paymentDueAt}
 * — flow ACCEPTED → CONFIRMED.
 * Technologie: Bean Validation, Jackson.
 * </p>
 * Pomysł (alt): OpenAPI generator; osobne DTO dla widoku kierowcy vs organizatora.
 */
public final class RegistrationDtos {

    private RegistrationDtos() {
    }

    /**
     * Profil użytkownika w odpowiedziach API (zgłoszenia, wnioski organizatora).
     * Pola kierowcy (imię, PJ, PZM…) wypełniane gdy dostępne — np. podgląd zgłoszenia.
     */
    public record UserRef(
            String id,
            String username,
            String email,
            String avatar,
            String firstName,
            String lastName,
            String phone,
            String address,
            String instagramUrl,
            boolean hasDrivingLicenseB,
            String pzmLicense
    ) {
        public static UserRef from(pl.raceportal.domain.User user) {
            return new UserRef(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getAvatar(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    user.getAddress(),
                    user.getInstagramUrl(),
                    user.isHasDrivingLicenseB(),
                    user.getPzmLicense()
            );
        }
    }

    /** Nowe zgłoszenie — {@code carId} opcjonalne, {@code note} dla organizatora. */
    public record RegistrationCreateRequest(
            @NotBlank String eventId,
            String carId,
            @Size(max = 500) String note
    ) {
    }

    /**
     * Decyzja organizatora — {@code status} może być aliasem (APPROVED/CANCELLED…);
     * {@code comment} trafia do {@code organizerComment}.
     */
    public record RegistrationStatusUpdateRequest(
            @NotBlank String status,
            @Size(max = 500) String comment
    ) {
    }

    /** URL dowodu przelewu (np. link do skanu / storage). */
    public record PaymentProofRequest(
            @NotBlank @Size(max = 500) String paymentProofUrl
    ) {
    }

    /**
     * Odpowiedź zgłoszenia — opcjonalnie zagnieżdżone {@code event}/{@code car}/{@code user}
     * zależnie od kontekstu serializacji.
     */
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
