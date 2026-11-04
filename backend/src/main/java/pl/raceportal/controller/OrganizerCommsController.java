package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.OrganizerCommsDtos.BroadcastRequest;
import pl.raceportal.dto.OrganizerCommsDtos.BroadcastResult;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.OrganizerCommsService;

@RestController
@RequestMapping("/api/events/{eventId}/comms")
public class OrganizerCommsController {

    private final OrganizerCommsService organizerCommsService;

    public OrganizerCommsController(OrganizerCommsService organizerCommsService) {
        this.organizerCommsService = organizerCommsService;
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<BroadcastResult> broadcast(
            @PathVariable String eventId,
            @Valid @RequestBody BroadcastRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(organizerCommsService.broadcast(eventId, request, currentUser));
    }
}
