package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.AdminDtos.OrganizerApplicationResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.OrganizerDtos.ApplyRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.OrganizerService;

import java.util.List;

@RestController
@RequestMapping("/api/organizer")
public class OrganizerController {

    private final OrganizerService organizerService;

    public OrganizerController(OrganizerService organizerService) {
        this.organizerService = organizerService;
    }

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrganizerApplicationResponse> apply(@AuthenticationPrincipal UserPrincipal currentUser,
                                                                @Valid @RequestBody ApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizerService.apply(currentUser, request));
    }

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<EventResponse>> events(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(organizerService.events(currentUser));
    }
}
