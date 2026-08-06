package pl.raceportal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO wydarzeń: odpowiedzi listy/szczegółów, markery mapy, create/update requesty.
 * <p>
 * Rola w architekturze: kontrakt REST {@code EventController} ↔ frontend ({@code api-types}).
 * Pola {@code require*} opisują wymogi zgłoszenia; {@code paid}/{@code entryFee}/{@code bankAccount}
 * — reguły płatności.
 * Technologie: Bean Validation, Jackson records.
 * </p>
 * Pomysł (alt): MapStruct; OpenAPI generator; osobne read/write modele CQRS.
 */
public final class EventDtos {

    private EventDtos() {
    }

    /** Skrót organizatora w odpowiedzi wydarzenia. */
    public record OrganizerRef(String id, String username) {
    }

    /** Pełna reprezentacja wydarzenia dla klienta SPA. */
    public record EventResponse(
            String id,
            String name,
            String description,
            String category,
            String date,
            String dateLabel,
            String time,
            String endDate,
            String endTime,
            String track,
            String street,
            String city,
            String voivodeship,
            String imageUrl,
            Double lat,
            Double lng,
            String status,
            String organizerId,
            OrganizerRef organizer,
            long registrationsCount,
            boolean paid,
            BigDecimal entryFee,
            String bankAccount,
            Integer paymentDeadlineHours,
            Integer freeCancelDays,
            boolean acceptRegistrations,
            BigDecimal spectatorFee,
            String externalUrl,
            boolean requireDrivingLicense,
            boolean requirePzmLicense,
            boolean requireOc,
            boolean requirePt,
            boolean requireCage,
            boolean requireRegistered
    ) {
    }

    /** Stronicowana odpowiedź listy wydarzeń. */
    public record EventListResponse(
            int page,
            int limit,
            long total,
            long totalPages,
            List<EventResponse> items
    ) {
    }

    /** Lekki payload pod mapę/kalendarz — bez limitu strony listy. */
    public record EventMarkerResponse(
            String id,
            String name,
            String category,
            String date,
            String dateLabel,
            String time,
            String track,
            String city,
            Double lat,
            Double lng,
            boolean paid,
            java.math.BigDecimal entryFee,
            String imageUrl
    ) {
    }

    /** Opakowanie listy markerów mapy. */
    public record EventMarkersResponse(
            long total,
            List<EventMarkerResponse> items
    ) {
    }

    /**
     * Tworzenie wydarzenia — pola płatności i wymogów {@code require*} opcjonalne;
     * {@code paid=true} wymaga sensownego {@code entryFee}/{@code bankAccount} (walidacja w serwisie/UI).
     */
    public record EventCreateRequest(
            @NotBlank @Size(min = 3, max = 120) String name,
            @NotBlank @Size(min = 10, max = 5000) String description,
            @NotBlank @Size(min = 2, max = 60) String category,
            @NotBlank String date,
            @NotBlank @Size(min = 1, max = 10) String time,
            String endDate,
            @Size(max = 10) String endTime,
            @NotBlank @Size(min = 2, max = 120) String track,
            @Size(max = 120) String street,
            @NotBlank @Size(min = 2, max = 80) String city,
            @NotBlank @Size(min = 2, max = 80) String voivodeship,
            String imageUrl,
            Double lat,
            Double lng,
            boolean paid,
            @DecimalMin(value = "0", inclusive = true) BigDecimal entryFee,
            @Size(max = 60) String bankAccount,
            @Positive Integer paymentDeadlineHours,
            @Positive Integer freeCancelDays,
            Boolean acceptRegistrations,
            @DecimalMin(value = "0", inclusive = true) BigDecimal spectatorFee,
            @Size(max = 500) String externalUrl,
            Boolean requireDrivingLicense,
            Boolean requirePzmLicense,
            Boolean requireOc,
            Boolean requirePt,
            Boolean requireCage,
            Boolean requireRegistered
    ) {
    }

    /** Częściowa aktualizacja wydarzenia (null = bez zmiany). */
    public record EventUpdateRequest(
            String name,
            String description,
            String category,
            String date,
            String time,
            String endDate,
            String endTime,
            String track,
            String street,
            String city,
            String voivodeship,
            String imageUrl,
            Double lat,
            Double lng,
            Boolean paid,
            BigDecimal entryFee,
            String bankAccount,
            Integer paymentDeadlineHours,
            Integer freeCancelDays,
            Boolean acceptRegistrations,
            BigDecimal spectatorFee,
            String externalUrl,
            Boolean requireDrivingLicense,
            Boolean requirePzmLicense,
            Boolean requireOc,
            Boolean requirePt,
            Boolean requireCage,
            Boolean requireRegistered
    ) {
    }
}
