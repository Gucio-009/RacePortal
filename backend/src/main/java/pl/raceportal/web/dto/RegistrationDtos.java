package pl.raceportal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import pl.raceportal.domain.RegistrationStatus;

public final class RegistrationDtos {
  private RegistrationDtos() {}

  public record CreateRegistrationRequest(
      @NotBlank String eventId, String carId, String note) {}

  public record StatusRequest(@NotNull RegistrationStatus status) {}

  public record UserBrief(String id, String username, String email, String avatar) {}
}
