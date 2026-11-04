package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.EventPointsRule;

import java.util.List;

public interface EventPointsRuleRepository extends JpaRepository<EventPointsRule, String> {

    List<EventPointsRule> findByEvent_IdOrderByPlaceAsc(String eventId);

    void deleteByEvent_Id(String eventId);
}
