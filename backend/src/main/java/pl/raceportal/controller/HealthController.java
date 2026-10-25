package pl.raceportal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Health-check API: publicznie tylko {@code status}, szczegóły dla ADMIN (pentest #10).
 * <p>
 * Docker / LB woła {@code GET /api/health} (permitAll) — bez SMTP, bez {@code publicBaseUrl}.
 * Diagnostyka: {@code GET /api/health/details} z JWT admina.
 * </p>
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;
    private final JavaMailSenderImpl mailSender;
    private final String publicBaseUrl;

    public HealthController(DataSource dataSource, JavaMailSenderImpl mailSender,
                            @Value("${app.public-base-url:https://raceportal.pl}") String publicBaseUrl) {
        this.dataSource = dataSource;
        this.mailSender = mailSender;
        this.publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.replaceAll("/+$", "");
    }

    /**
     * Publiczny ping: wyłącznie {@code status} ({@code ok} / {@code degraded}).
     * HTTP 200 gdy DB żyje, 503 gdy nie — bez ujawniania smtp / URL / timestamp.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp = isDatabaseUp();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", dbUp ? "ok" : "degraded");
        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    /** Pełna diagnostyka — tylko ADMIN (nie publiczny rekonesans). */
    @GetMapping("/details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> healthDetails() {
        boolean dbUp = isDatabaseUp();
        boolean smtpUp = isSmtpUp();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", dbUp ? "ok" : "degraded");
        body.put("service", "raceportal-api");
        body.put("time", Instant.now().toString());
        body.put("db", dbUp ? "up" : "down");
        body.put("smtp", smtpUp ? "up" : "down");
        body.put("publicBaseUrl", publicBaseUrl);

        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    private boolean isDatabaseUp() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * SMTP nie może zablokować healthchecka Dockera (timeout 10s).
     * Połączenie z Mailbuxem bywa wolniejsze niż sam start Tomcata.
     */
    private boolean isSmtpUp() {
        try {
            return CompletableFuture.supplyAsync(this::probeSmtp).get(8, TimeUnit.SECONDS);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean probeSmtp() {
        try {
            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.smtp.connectiontimeout", "8000");
            props.put("mail.smtp.timeout", "8000");
            props.put("mail.smtp.writetimeout", "8000");
            mailSender.testConnection();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
