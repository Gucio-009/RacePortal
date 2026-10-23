package pl.raceportal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.PublicStatsDtos.PublicStatsResponse;
import pl.raceportal.service.StatsService;

/**
 * Publiczne statystyki zagregowane — bez JWT, bez danych osobowych.
 * <p>
 * {@code GET /api/stats} → liczba zarejestrowanych kont (ta sama co {@code /api/admin/stats.users}).
 * </p>
 */
@RestController
@RequestMapping("/api/stats")
public class PublicStatsController {

    private final StatsService statsService;

    public PublicStatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public ResponseEntity<PublicStatsResponse> publicStats() {
        return ResponseEntity.ok(new PublicStatsResponse(statsService.countRegisteredUsers()));
    }
}
