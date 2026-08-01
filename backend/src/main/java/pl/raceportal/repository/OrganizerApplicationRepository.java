package pl.raceportal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.RegistrationStatus;

public interface OrganizerApplicationRepository extends JpaRepository<OrganizerApplication, String> {
  List<OrganizerApplication> findByStatusOrderByCreatedAtDesc(RegistrationStatus status);
  List<OrganizerApplication> findAllByOrderByCreatedAtDesc();
  long countByStatus(RegistrationStatus status);
}
