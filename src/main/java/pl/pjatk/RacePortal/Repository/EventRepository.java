package pl.pjatk.RacePortal.Repository;

import pl.pjatk.RacePortal.Entities.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("""
        SELECT e FROM Event e
        JOIN e.category c
        JOIN e.location l
        JOIN l.region r
        WHERE (:categoryId IS NULL OR c.id = :categoryId)
          AND (:regionId IS NULL OR r.id = :regionId)
          AND (:dateFrom IS NULL OR e.dateStart >= :dateFrom)
          AND (:dateTo IS NULL OR e.dateEnd <= :dateTo)
        ORDER BY e.dateStart ASC
    """)
    List<Event> findFiltered(
            @Param("categoryId") Long categoryId,
            @Param("regionId") Long regionId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );
}
