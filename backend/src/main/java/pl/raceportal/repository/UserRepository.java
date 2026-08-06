package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.User;

import java.util.List;
import java.util.Optional;

/**
 * Repozytorium JPA użytkowników.
 * <p>
 * Rola w architekturze: dostęp do tabeli {@code users} dla auth, profilu i admina.
 * Technologie: Spring Data JPA, MySQL.
 * </p>
 * Pomysł (alt): QueryDSL / Criteria API dla zaawansowanych filtrów admina;
 * PostgreSQL zamiast MySQL.
 */
public interface UserRepository extends JpaRepository<User, String> {

    /** Logowanie / OAuth — wyszukanie po emailu (case-insensitive). */
    Optional<User> findByEmailIgnoreCase(String email);

    /** Unikalność email przy rejestracji. */
    boolean existsByEmailIgnoreCase(String email);

    /** Unikalność nazwy wyświetlanej przy rejestracji. */
    boolean existsByUsernameIgnoreCase(String username);

    /** Lista użytkowników dla panelu admina (najnowsi pierwsi). */
    List<User> findAllByOrderByCreatedAtDesc();
}
