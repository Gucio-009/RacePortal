package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.OrganizerApplication;

import java.util.List;
import java.util.Optional;

/**
 * Repozytorium wniosków o rolę organizatora.
 * <p>
 * Rola w architekturze: kolejka moderacji admina oraz sprawdzenie otwartego wniosku
 * użytkownika (PENDING). Technologie: Spring Data JPA, MySQL.
 * </p>
 * Pomysł (alt): workflow engine zamiast prostej tabeli statusów.
 */
public interface OrganizerApplicationRepository extends JpaRepository<OrganizerApplication, String> {

    /** Czy użytkownik ma już wniosek w danym statusie (np. PENDING). */
    Optional<OrganizerApplication> findFirstByUser_IdAndStatus(String userId, ApplicationStatus status);

    /** Pełna lista wniosków dla panelu admina. */
    List<OrganizerApplication> findAllByOrderByCreatedAtDesc();

    /** Statystyki — liczba wniosków w statusie. */
    long countByStatus(ApplicationStatus status);
}
