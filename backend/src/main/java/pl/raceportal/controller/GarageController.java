package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.GarageDtos.CarCreateRequest;
import pl.raceportal.dto.GarageDtos.CarResponse;
import pl.raceportal.dto.GarageDtos.CarUpdateRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.GarageService;

import java.util.List;

@RestController
@RequestMapping("/api/garage")
@PreAuthorize("isAuthenticated()")
public class GarageController {

    private final GarageService garageService;

    public GarageController(GarageService garageService) {
        this.garageService = garageService;
    }

    @GetMapping
    public ResponseEntity<List<CarResponse>> list(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(garageService.list(currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<CarResponse> create(@AuthenticationPrincipal UserPrincipal currentUser,
                                               @Valid @RequestBody CarCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(garageService.create(currentUser.getId(), request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CarResponse> update(@AuthenticationPrincipal UserPrincipal currentUser,
                                               @PathVariable String id,
                                               @Valid @RequestBody CarUpdateRequest request) {
        return ResponseEntity.ok(garageService.update(currentUser.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal currentUser, @PathVariable String id) {
        garageService.delete(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
