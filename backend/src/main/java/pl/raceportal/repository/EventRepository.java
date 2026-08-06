package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;

import java.util.List;

/**
 * Repozytorium JPA wydarzeń z obsługą Specification (dynamiczne filtry).
 * <p>
 * Rola w architekturze: CRUD + zapytania dla listy publicznej, panelu organizatora
 * i moderacji admina. {@link JpaSpecificationExecutor} wspiera filtrowanie
 * w {@code EventService} (kategoria, miasto, data, status…).
 * Technologie: Spring Data JPA, MySQL.
 * </p>
 * Pomysł (alt): Elasticsearch do full-text search po nazwie/opisie;
 * OpenAPI generator pod kontrakt filtrów.
 */
public interface EventRepository extends JpaRepository<Event, String>, JpaSpecificationExecutor<Event> {

    /** Wydarzenia danego organizatora (panel organizatora). */
    List<Event> findByOrganizer_IdOrderByDateDesc(String organizerId);

    /** Wszystkie wydarzenia sortowane datą malejąco. */
    List<Event> findAllByOrderByDateDesc();

    /** Kolejka moderacji (np. PENDING) — najstarsze pierwsze. */
    List<Event> findByStatusOrderByCreatedAtAsc(EventStatus status);

    /** Lista po zestawie statusów (np. APPROVED+ARCHIVED) posortowana kategorią. */
    List<Event> findByStatusInOrderByCategoryAsc(List<EventStatus> statuses);

    /** Statystyki admina — liczba wydarzeń w statusie. */
    long countByStatus(EventStatus status);

    /** Seed / deduplikacja po nazwie (DataInitializer). */
    java.util.Optional<Event> findFirstByNameIgnoreCase(String name);
}
