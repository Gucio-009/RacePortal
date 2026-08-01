package pl.raceportal.web.dto;

import jakarta.validation.constraints.NotBlank;

public final class GarageDtos {
  private GarageDtos() {}

  public record CarResponse(
      String id,
      String userId,
      String make,
      String model,
      Integer year,
      String className,
      String plate,
      String imageUrl,
      String createdAt,
      String updatedAt) {}

  public record CreateCarRequest(
      @NotBlank String make,
      @NotBlank String model,
      Integer year,
      String className,
      String plate,
      String imageUrl) {}
}
