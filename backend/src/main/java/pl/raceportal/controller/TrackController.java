package pl.raceportal.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.domain.Track;
import pl.raceportal.repository.TrackRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Publiczny katalog torów / miejsc eventowych (presety lokalizacji).
 */
@RestController
@RequestMapping("/api/tracks")
public class TrackController {

    private final TrackRepository trackRepository;

    public TrackController(TrackRepository trackRepository) {
        this.trackRepository = trackRepository;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return trackRepository.findAllByOrderByVoivodeshipAscNameAsc().stream()
                .map(TrackController::toDto)
                .toList();
    }

    private static Map<String, Object> toDto(Track t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("track", t.getName());
        m.put("name", t.getName());
        m.put("city", t.getCity());
        m.put("voivodeship", t.getVoivodeship());
        m.put("lat", t.getLat());
        m.put("lng", t.getLng());
        m.put("kind", t.getKind());
        return m;
    }
}
