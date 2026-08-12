package pl.raceportal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSenderImpl;
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
    private final JavaMailSenderImpl mailSender;

    public HealthController(DataSource dataSource, JavaMailSenderImpl mailSender) {
        this.dataSource = dataSource;
        this.mailSender = mailSender;
    }

    /** Sprawdza żywotność JDBC (timeout 2s) i buduje JSON statusu. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp = isDatabaseUp();
        boolean smtpUp = isSmtpUp();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", dbUp ? "ok" : "degraded");
        body.put("service", "raceportal-api");
        body.put("time", Instant.now().toString());
        body.put("db", dbUp ? "up" : "down");
        body.put("smtp", smtpUp ? "up" : "down");

        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    private boolean isDatabaseUp() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isSmtpUp() {
        try {
            mailSender.testConnection();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
