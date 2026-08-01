package pl.raceportal.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Registration;

public interface RegistrationRepository extends JpaRepository<Registration, String> {
  List<Registration> findByUserIdOrderByCreatedAtDesc(String userId);
  List<Registration> findByEventIdOrderByCreatedAtDesc(String eventId);
  Optional<Registration> findByUserIdAndEventId(String userId, String eventId);
  long countByEventId(String eventId);
}
