package pl.raceportal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class EventDtos {

    private EventDtos() {
    }

    public record OrganizerRef(String id, String username) {
    }

    public record EventResponse(
            String id,
            String name,
            String description,
            String category,
            String date,
            String dateLabel,
            String time,
            String track,
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
            boolean acceptRegistrations
    ) {
    }

    public record EventListResponse(
            int page,
            int limit,
            long total,
            long totalPages,
            List<EventResponse> items
    ) {
    }

    public record EventCreateRequest(
            @NotBlank @Size(min = 3, max = 120) String name,
            @NotBlank @Size(min = 10, max = 5000) String description,
            @NotBlank @Size(min = 2, max = 40) String category,
            @NotBlank String date,
            @NotBlank @Size(min = 1, max = 10) String time,
            @NotBlank @Size(min = 2, max = 120) String track,
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
            Boolean acceptRegistrations
    ) {
    }

    public record EventUpdateRequest(
            String name,
            String description,
            String category,
            String date,
            String time,
            String track,
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
            Boolean acceptRegistrations
    ) {
    }
}
