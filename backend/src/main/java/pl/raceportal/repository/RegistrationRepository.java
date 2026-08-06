package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;

import java.util.List;
import java.util.Optional;

/**
 * Repozytorium JPA zgłoszeń na wydarzenia.
 * <p>
 * Rola w architekturze: zapytania dla zawodnika („moje zgłoszenia”), organizatora
 * (lista na wydarzenie) oraz reguł biznesowych (unikalność user+event, blokada
 * usuwania auta przy aktywnych statusach).
 * Technologie: Spring Data JPA, MySQL.
 * </p>
 * Pomysł (alt): projekcje Spring Data (DTO interface) zamiast mapowania w serwisie.
 */
public interface RegistrationRepository extends JpaRepository<Registration, String> {

    /** Historia zgłoszeń zawodnika. */
    List<Registration> findByUser_IdOrderByCreatedAtDesc(String userId);

    /** Zgłoszenia na konkretne wydarzenie (panel organizatora). */
    List<Registration> findByEvent_IdOrderByCreatedAtDesc(String eventId);

    /** Sprawdzenie czy użytkownik już się zgłosił (unikalność biznesowa). */
    Optional<Registration> findByUser_IdAndEvent_Id(String userId, String eventId);

    /** Licznik uczestników wydarzenia. */
    long countByEvent_Id(String eventId);

    /**
     * Czy auto jest użyte w zgłoszeniach o podanych statusach —
     * blokuje usunięcie pojazdu z garażu przy aktywnych zgłoszeniach.
     */
    boolean existsByCar_IdAndStatusIn(String carId, List<RegistrationStatus> statuses);
}
