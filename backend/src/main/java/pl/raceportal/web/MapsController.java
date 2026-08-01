package pl.raceportal.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.service.MapsService;
import pl.raceportal.web.dto.MapsDtos;

@RestController
@RequestMapping("/api/maps")
public class MapsController {
  private final MapsService maps;

  public MapsController(MapsService maps) {
    this.maps = maps;
  }

  @PostMapping("/route")
  public MapsDtos.RouteResponse route(@Valid @RequestBody MapsDtos.RouteRequest req) {
    return maps.route(req);
  }
}
