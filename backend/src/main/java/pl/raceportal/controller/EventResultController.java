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
import pl.raceportal.dto.EventResultDtos.EventResultResponse;
import pl.raceportal.dto.EventResultDtos.EventResultUpsertRequest;
import pl.raceportal.dto.EventResultDtos.PointsRuleResponse;
import pl.raceportal.dto.EventResultDtos.PointsRulesReplaceRequest;
import pl.raceportal.dto.EventResultDtos.PublishResultsRequest;
import pl.raceportal.dto.EventResultDtos.RecalcResult;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.EventResultService;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/results")
public class EventResultController {

    private final EventResultService eventResultService;

    public EventResultController(EventResultService eventResultService) {
        this.eventResultService = eventResultService;
    }

    /** Publiczne gdy opublikowane; inaczej tylko organizator/admin. */
    @GetMapping
    public ResponseEntity<List<EventResultResponse>> list(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventResultService.list(eventId, currentUser));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<EventResultResponse> upsert(
            @PathVariable String eventId,
            @Valid @RequestBody EventResultUpsertRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventResultService.upsert(eventId, request, currentUser));
    }

    @DeleteMapping("/{resultId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable String eventId,
            @PathVariable String resultId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventResultService.delete(eventId, resultId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ensure")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<EventResultResponse>> ensure(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventResultService.ensureRows(eventId, currentUser));
    }

    @PostMapping("/recalc")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<RecalcResult> recalc(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventResultService.recalcPositionsAndPoints(eventId, currentUser));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Void> publish(
            @PathVariable String eventId,
            @Valid @RequestBody PublishResultsRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventResultService.setPublished(eventId, request.published(), currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/points-rules")
    public ResponseEntity<List<PointsRuleResponse>> pointsRules(@PathVariable String eventId) {
        return ResponseEntity.ok(eventResultService.listPointsRules(eventId));
    }

    @PutMapping("/points-rules")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<PointsRuleResponse>> replacePointsRules(
            @PathVariable String eventId,
            @Valid @RequestBody PointsRulesReplaceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventResultService.replacePointsRules(eventId, request, currentUser));
    }
}
