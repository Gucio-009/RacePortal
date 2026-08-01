package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, String>, JpaSpecificationExecutor<Event> {

    List<Event> findByOrganizer_IdOrderByDateDesc(String organizerId);

    List<Event> findAllByOrderByDateDesc();

    List<Event> findByStatusOrderByCreatedAtAsc(EventStatus status);

    List<Event> findByStatusInOrderByCategoryAsc(List<EventStatus> statuses);

    long countByStatus(EventStatus status);
}
