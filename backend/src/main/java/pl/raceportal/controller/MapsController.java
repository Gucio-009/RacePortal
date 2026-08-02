package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.MapsDtos.RouteRequest;
import pl.raceportal.dto.MapsDtos.RouteResponse;
import pl.raceportal.service.MapsService;

@RestController
@RequestMapping("/api/maps")
public class MapsController {

    private final MapsService mapsService;

    public MapsController(MapsService mapsService) {
        this.mapsService = mapsService;
    }

    @PostMapping("/route")
    public ResponseEntity<RouteResponse> route(@Valid @RequestBody RouteRequest request) {
        return ResponseEntity.ok(mapsService.route(request));
    }
}
