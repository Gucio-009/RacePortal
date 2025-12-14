package pl.pjatk.RacePortal.Repository;

import  pl.pjatk.RacePortal.Entities.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}
