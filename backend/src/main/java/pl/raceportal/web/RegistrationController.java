package pl.raceportal.web;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.security.AuthSupport;
import pl.raceportal.service.RegistrationService;
import pl.raceportal.web.dto.RegistrationDtos;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
  private final RegistrationService registrations;

  public RegistrationController(RegistrationService registrations) {
    this.registrations = registrations;
  }

  @GetMapping("/mine")
  public List<Map<String, Object>> mine() {
    return registrations.mine(AuthSupport.requireUser());
  }

  @PostMapping
  public Map<String, Object> create(@Valid @RequestBody RegistrationDtos.CreateRegistrationRequest req) {
    return registrations.create(req, AuthSupport.requireUser());
  }

  @GetMapping("/event/{eventId}")
  public List<Map<String, Object>> byEvent(@PathVariable String eventId) {
    return registrations.byEvent(eventId, AuthSupport.requireUser());
  }

  @PatchMapping("/{id}/status")
  public Map<String, Object> updateStatus(
      @PathVariable String id, @Valid @RequestBody RegistrationDtos.StatusRequest req) {
    return registrations.updateStatus(id, req.status(), AuthSupport.requireUser());
  }
}
