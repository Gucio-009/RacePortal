package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Car;

import java.util.List;
import java.util.Optional;

/**
 * Repozytorium JPA samochodów w garażu użytkownika.
 * <p>
 * Rola w architekturze: izolacja danych garażu per userId (ownership).
 * Technologie: Spring Data JPA, MySQL.
 * </p>
 * Pomysł (alt): soft-delete zamiast twardego usuwania przy aktywnych zgłoszeniach.
 */
public interface CarRepository extends JpaRepository<Car, String> {

    /** Lista pojazdów użytkownika (garaż). */
    List<Car> findByUser_IdOrderByCreatedAtDesc(String userId);

    /** Pobranie pojazdu tylko jeśli należy do użytkownika (RBAC ownership). */
    Optional<Car> findByIdAndUser_Id(String id, String userId);

    /** Seed / uniknięcie duplikatów marka+model w garażu użytkownika. */
    Optional<Car> findFirstByUser_IdAndMakeIgnoreCaseAndModelIgnoreCase(String userId, String make, String model);
}
