package pl.raceportal.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate {@code ddl-auto: update} nie zmienia VARCHAR na TEXT.
 * Długi adres zdjęcia wydarzenia musi się zmieścić tak jak w garażu.
 */
@Component
public class EventImageUrlColumn {

    private static final Logger log = LoggerFactory.getLogger(EventImageUrlColumn.class);

    private final JdbcTemplate jdbc;

    public EventImageUrlColumn(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void widen() {
        try {
            jdbc.execute("ALTER TABLE events MODIFY image_url TEXT NULL");
        } catch (RuntimeException ex) {
            log.debug("Pominięto ALTER events.image_url: {}", ex.getMessage());
        }
    }
}
