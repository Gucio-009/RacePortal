package pl.raceportal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.StartListDtos.StartListResponse;
import pl.raceportal.service.StartListService;

@RestController
@RequestMapping("/api/events/{eventId}/start-list")
public class StartListController {

    private final StartListService startListService;

    public StartListController(StartListService startListService) {
        this.startListService = startListService;
    }

    /** Publiczna lista startowa — tylko CONFIRMED, bez PII kontaktowych. */
    @GetMapping
    public ResponseEntity<StartListResponse> list(@PathVariable String eventId) {
        return ResponseEntity.ok(startListService.list(eventId));
    }
}
