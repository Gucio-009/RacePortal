package pl.raceportal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.MapsDtos;

@Service
public class MapsService {
  private final String googleKey;
  private final ObjectMapper mapper = new ObjectMapper();
  private final HttpClient client = HttpClient.newHttpClient();

  public MapsService(@Value("${app.maps.google-api-key:}") String googleKey) {
    this.googleKey = googleKey == null ? "" : googleKey;
  }

  public MapsDtos.RouteResponse route(MapsDtos.RouteRequest req) {
    try {
      String url = String.format(
          "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
          req.fromLng(), req.fromLat(), req.toLng(), req.toLat());
      HttpRequest httpReq = HttpRequest.newBuilder(URI.create(url)).GET().build();
      HttpResponse<String> res = client.send(httpReq, HttpResponse.BodyHandlers.ofString());
      if (res.statusCode() >= 400) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, "Mapa chwilowo niedostępna");
      }
      JsonNode root = mapper.readTree(res.body());
      JsonNode route = root.path("routes").path(0);
      if (route.isMissingNode()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Nie udało się wyznaczyć trasy");
      }
      long meters = Math.round(route.path("distance").asDouble());
      long seconds = Math.round(route.path("duration").asDouble());
      List<double[]> polyline = new ArrayList<>();
      for (JsonNode coord : route.path("geometry").path("coordinates")) {
        polyline.add(new double[]{coord.get(1).asDouble(), coord.get(0).asDouble()});
      }
      return new MapsDtos.RouteResponse(
          "osrm",
          meters,
          seconds,
          String.format("%.1f km", meters / 1000.0),
          String.format("%d min", Math.max(1, seconds / 60)),
          polyline);
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "Mapa chwilowo niedostępna");
    }
  }
}
