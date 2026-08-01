package pl.raceportal.web;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.security.AuthSupport;
import pl.raceportal.service.OrganizerService;
import pl.raceportal.web.dto.AdminDtos;

@RestController
@RequestMapping("/api/organizer")
public class OrganizerController {
  private final OrganizerService organizer;

  public OrganizerController(OrganizerService organizer) {
    this.organizer = organizer;
  }

  @PostMapping("/apply")
  public Map<String, Object> apply(@Valid @RequestBody AdminDtos.ApplyRequest req) {
    return organizer.apply(req, AuthSupport.requireUser());
  }

  @GetMapping("/events")
  public List<Map<String, Object>> myEvents() {
    return organizer.myEvents(AuthSupport.requireUser());
  }
}
