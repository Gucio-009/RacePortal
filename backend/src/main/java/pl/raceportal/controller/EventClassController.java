package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.EventClassDtos.AutoAssignResult;
import pl.raceportal.dto.EventClassDtos.EventClassResponse;
import pl.raceportal.dto.EventClassDtos.EventClassUpsertRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.EventClassService;

import java.util.List;

/**
 * REST API klas zawodów w ramach wydarzenia.
 * GET publiczne (lista startowa / UI); mutacje dla organizatora/admina.
 */
@RestController
@RequestMapping("/api/events/{eventId}/classes")
public class EventClassController {

    private final EventClassService eventClassService;

    public EventClassController(EventClassService eventClassService) {
        this.eventClassService = eventClassService;
    }

    @GetMapping
    public ResponseEntity<List<EventClassResponse>> list(@PathVariable String eventId) {
        return ResponseEntity.ok(eventClassService.list(eventId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventClassResponse> create(@PathVariable String eventId,
                                                      @Valid @RequestBody EventClassUpsertRequest request,
                                                      @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventClassService.create(eventId, request, currentUser));
    }

    @PutMapping("/{classId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventClassResponse> update(@PathVariable String eventId,
                                                      @PathVariable String classId,
                                                      @Valid @RequestBody EventClassUpsertRequest request,
                                                      @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventClassService.update(eventId, classId, request, currentUser));
    }

    @DeleteMapping("/{classId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String eventId,
                                        @PathVariable String classId,
                                        @AuthenticationPrincipal UserPrincipal currentUser) {
        eventClassService.delete(eventId, classId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/auto-assign")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<AutoAssignResult> autoAssign(@PathVariable String eventId,
                                                        @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventClassService.autoAssignAll(eventId, currentUser));
    }
}
