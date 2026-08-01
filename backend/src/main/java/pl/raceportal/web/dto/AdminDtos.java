package pl.raceportal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;

public final class AdminDtos {
  private AdminDtos() {}

  public record StatsResponse(long users, long events, long pendingEvents, long registrations, long pendingApps) {}

  public record RoleRequest(@NotNull Role role) {}

  public record EventStatusRequest(@NotNull EventStatus status) {}

  public record ApplicationStatusRequest(@NotNull RegistrationStatus status) {}

  public record ApplyRequest(@NotBlank String company, @NotBlank String message) {}
}
