package pl.raceportal.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Car;

public interface CarRepository extends JpaRepository<Car, String> {
  List<Car> findByUserIdOrderByCreatedAtDesc(String userId);
}
