package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.OrganizerApplication;

import java.util.List;
import java.util.Optional;

public interface OrganizerApplicationRepository extends JpaRepository<OrganizerApplication, String> {

    Optional<OrganizerApplication> findFirstByUser_IdAndStatus(String userId, ApplicationStatus status);

    List<OrganizerApplication> findAllByOrderByCreatedAtDesc();

    long countByStatus(ApplicationStatus status);
}
