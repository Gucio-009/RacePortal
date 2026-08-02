package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Car;

import java.util.List;
import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, String> {

    List<Car> findByUser_IdOrderByCreatedAtDesc(String userId);

    Optional<Car> findByIdAndUser_Id(String id, String userId);

    Optional<Car> findFirstByUser_IdAndMakeIgnoreCaseAndModelIgnoreCase(String userId, String make, String model);
}
