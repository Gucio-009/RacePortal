package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.EventResult;

import java.util.List;
import java.util.Optional;

public interface EventResultRepository extends JpaRepository<EventResult, String> {

    List<EventResult> findByEvent_IdOrderByPositionAscCreatedAtAsc(String eventId);

    Optional<EventResult> findByRegistration_Id(String registrationId);

    Optional<EventResult> findByIdAndEvent_Id(String id, String eventId);

    void deleteByEvent_Id(String eventId);
}
