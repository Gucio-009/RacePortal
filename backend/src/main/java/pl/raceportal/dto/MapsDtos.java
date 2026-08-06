package pl.raceportal.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * DTO map / routingu OSRM.
 * <p>
 * Rola w architekturze: request/response {@code MapsController} → {@code MapsService}.
 * {@code polyline} to lista punktów [lat, lng] dla Leaflet.
 * Technologie: Bean Validation, Jackson.
 * </p>
 * Pomysł (alt): encoded polyline (Google) zamiast tablicy współrzędnych.
 */
public final class MapsDtos {

    private MapsDtos() {
    }

    /** Punkty start/cel trasy dojazdu (WGS84). */
    public record RouteRequest(
            @NotNull Double fromLat,
            @NotNull Double fromLng,
            @NotNull Double toLat,
            @NotNull Double toLng
    ) {
    }

    /** Wynik OSRM: dystans, czas, czytelne teksty i geometria. */
    public record RouteResponse(
            String provider,
            long distanceMeters,
            long durationSeconds,
            String distanceText,
            String durationText,
            List<double[]> polyline
    ) {
    }
}
