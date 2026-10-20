package pl.raceportal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pl.raceportal.dto.MapsDtos.RouteRequest;
import pl.raceportal.dto.MapsDtos.RouteResponse;
import pl.raceportal.web.ApiException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Proxy do publicznego API OSRM — wytyczanie trasy dojazdu na tor.
 * <p>
 * Rola w architekturze: backend ukrywa CORS/rate-limit OSRM przed frontendem;
 * endpoint map jest publiczny (bez JWT). Technologie: Java HttpClient, Jackson,
 * OSRM ({@code router.project-osrm.org}).
 * </p>
 * Odpowiedź: dystans, czas, polyline (współrzędne [lat,lng] dla Leaflet).
 * <p>
 * Pomysł (alt): Google Directions / Mapbox Directions; self-hosted OSRM;
 * cache tras w Redis.
 * </p>
 */
@Service
public class MapsService {

    private static final Logger log = LoggerFactory.getLogger(MapsService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper;

    public MapsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Wywołuje OSRM driving route między dwoma punktami (lng,lat).
     * Przy błędzie sieci lub {@code code != Ok} rzuca {@link ApiException#badGateway}.
     */
    public RouteResponse route(RouteRequest request) {
        String url = String.format(Locale.ROOT,
                "https://router.project-osrm.org/route/v1/driving/%s,%s;%s,%s?overview=full&geometries=geojson",
                request.fromLng(), request.fromLat(), request.toLng(), request.toLat());

        JsonNode json;
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            json = objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("[maps] OSRM request failed: {}", e.getMessage());
            throw ApiException.badGateway("Nie udało się wytyczyć trasy");
        }

        JsonNode routes = json.path("routes");
        if (!"Ok".equals(json.path("code").asText()) || !routes.isArray() || routes.isEmpty()) {
            throw ApiException.badGateway("Nie udało się wytyczyć trasy");
        }

        JsonNode route = routes.get(0);
        double distanceMeters = route.path("distance").asDouble();
        double durationSeconds = route.path("duration").asDouble();

        // OSRM zwraca [lng,lat]; frontend map oczekuje [lat,lng]
        List<double[]> polyline = new ArrayList<>();
        for (JsonNode coord : route.path("geometry").path("coordinates")) {
            double lng = coord.get(0).asDouble();
            double lat = coord.get(1).asDouble();
            polyline.add(new double[]{lat, lng});
        }

        return new RouteResponse(
                "osrm",
                Math.round(distanceMeters),
                Math.round(durationSeconds),
                String.format(Locale.ROOT, "%.1f km", distanceMeters / 1000),
                String.format(Locale.ROOT, "%d min", Math.round(durationSeconds / 60)),
                polyline
        );
    }
}
