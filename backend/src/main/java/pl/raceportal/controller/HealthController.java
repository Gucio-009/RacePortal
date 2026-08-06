package pl.raceportal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Publiczny endpoint health-check API i bazy MySQL.
 * <p>
 * Rola w architekturze: monitoring / load balancer / Docker healthcheck —
 * bez JWT ({@code SecurityConfig} permitAll). Technologie: Spring Web, JDBC DataSource.
 * </p>
 * Zwraca {@code ok} (200) gdy DB odpowiada, {@code degraded} (503) gdy połączenie pada.
 * <p>
 * Pomysł (alt): Spring Boot Actuator ({@code /actuator/health}) z gotowymi indicatorami.
 * </p>
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Sprawdza żywotność JDBC (timeout 2s) i buduje JSON statusu. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp = isDatabaseUp();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", dbUp ? "ok" : "degraded");
        body.put("service", "raceportal-api");
        body.put("time", Instant.now().toString());
        body.put("db", dbUp ? "up" : "down");

        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    private boolean isDatabaseUp() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }
}
