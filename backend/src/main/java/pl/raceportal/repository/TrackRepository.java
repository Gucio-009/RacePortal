package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Track;

import java.util.List;
import java.util.Optional;

/** Katalog torów / miejsc eventowych. */
public interface TrackRepository extends JpaRepository<Track, String> {

    Optional<Track> findFirstByNameIgnoreCase(String name);

    List<Track> findAllByOrderByVoivodeshipAscNameAsc();

    long count();
}
