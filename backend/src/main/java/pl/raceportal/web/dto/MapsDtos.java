package pl.raceportal.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class MapsDtos {
  private MapsDtos() {}

  public record RouteRequest(
      @NotNull Double fromLat,
      @NotNull Double fromLng,
      @NotNull Double toLat,
      @NotNull Double toLng) {}

  public record RouteResponse(
      String provider,
      long distanceMeters,
      long durationSeconds,
      String distanceText,
      String durationText,
      List<double[]> polyline) {}
}
