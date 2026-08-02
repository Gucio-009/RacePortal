package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.EventDtos.EventCreateRequest;
import pl.raceportal.dto.EventDtos.EventListResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.EventDtos.EventUpdateRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<EventListResponse> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false, defaultValue = "0") String archive,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean archiveFlag = "1".equals(archive);
        return ResponseEntity.ok(eventService.list(page, limit, q, category, city, archiveFlag, status, currentUser));
    }

    @GetMapping("/meta/categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok(eventService.categories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getById(@PathVariable String id,
                                                  @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.getById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventCreateRequest request,
                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.create(request, currentUser));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventResponse> update(@PathVariable String id,
                                                 @RequestBody EventUpdateRequest request,
                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.update(id, request, currentUser));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventResponse> cancel(@PathVariable String id,
                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.cancelEvent(id, currentUser));
    }
}
