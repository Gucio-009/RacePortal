package pl.raceportal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class EventDtos {
  private EventDtos() {}

  public record OrganizerBrief(String id, String username) {}

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
      OrganizerBrief organizer,
      Long registrationsCount) {}

  public record EventPageResponse(
      int page, int limit, long total, int totalPages, List<EventResponse> items) {}

  public record CreateEventRequest(
      @NotBlank String name,
      @NotBlank String description,
      @NotBlank String category,
      @NotBlank String date,
      @NotBlank String time,
      @NotBlank String track,
      @NotBlank String city,
      @NotBlank String voivodeship,
      String imageUrl,
      Double lat,
      Double lng) {}

  public record PatchEventRequest(
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
      Double lng) {}
}
