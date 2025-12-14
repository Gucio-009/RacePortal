package pl.pjatk.RacePortal.Repository;

import pl.pjatk.RacePortal.Entities.Region;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, Long> {
}
