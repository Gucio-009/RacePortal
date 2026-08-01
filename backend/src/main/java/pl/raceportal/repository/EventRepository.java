package pl.raceportal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;

public interface EventRepository extends JpaRepository<Event, String>, JpaSpecificationExecutor<Event> {
  List<Event> findByOrganizerIdOrderByDateAsc(String organizerId);
  long countByStatus(EventStatus status);
  List<Event> findDistinctByStatus(EventStatus status);
}
