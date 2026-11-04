package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.raceportal.domain.EventClass;

import java.util.List;
import java.util.Optional;

public interface EventClassRepository extends JpaRepository<EventClass, String> {

    List<EventClass> findByEvent_IdOrderBySortOrderAscCreatedAtAsc(String eventId);

    Optional<EventClass> findByIdAndEvent_Id(String id, String eventId);

    long countByEvent_Id(String eventId);

    @Modifying
    @Query("DELETE FROM EventClass c WHERE c.event.id = :eventId")
    void deleteByEvent_Id(@Param("eventId") String eventId);
}
