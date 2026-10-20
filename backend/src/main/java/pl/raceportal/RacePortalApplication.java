package pl.raceportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Główna klasa startowa aplikacji RacePortal (backend).
 * <p>
 * Rola w architekturze: punkt wejścia Spring Boot — uruchamia kontekst aplikacji,
 * skanuje komponenty w pakiecie {@code pl.raceportal} oraz włącza schedulery
 * (np. archiwizacja wydarzeń, terminy płatności).
 * </p>
 * Technologie: Spring Boot, Spring Scheduling; warstwa danych to JPA/Hibernate + MySQL,
 * bezpieczeństwo oparte o JWT i Spring Security, integracje: Mail, Google OAuth, OSRM (mapy).
 * <p>
 * Pomysł (alt): Quarkus lub Micronaut zamiast Spring Boot (krótszy cold-start);
 * osobny serwis auth (Keycloak) zamiast własnego JWT w monolicie.
 * </p>
 */
@SpringBootApplication
@EnableScheduling
public class RacePortalApplication {

    /**
     * Uruchamia kontekst Spring Boot z argumentami CLI (profile, port itd.).
     */
    public static void main(String[] args) {
        SpringApplication.run(RacePortalApplication.class, args);
    }
}
