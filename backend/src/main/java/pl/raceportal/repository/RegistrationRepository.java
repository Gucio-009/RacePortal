package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Registration;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, String> {

    List<Registration> findByUser_IdOrderByCreatedAtDesc(String userId);

    List<Registration> findByEvent_IdOrderByCreatedAtDesc(String eventId);

    Optional<Registration> findByUser_IdAndEvent_Id(String userId, String eventId);

    long countByEvent_Id(String eventId);
}
