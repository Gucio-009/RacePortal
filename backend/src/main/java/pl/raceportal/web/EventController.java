package pl.raceportal.web;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.security.AuthSupport;
import pl.raceportal.service.EventService;
import pl.raceportal.web.dto.EventDtos;

@RestController
@RequestMapping("/api/events")
public class EventController {
  private final EventService events;

  public EventController(EventService events) {
    this.events = events;
  }

  @GetMapping
  public EventDtos.EventPageResponse list(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "12") int limit,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String city,
      @RequestParam(required = false) String archive,
      @RequestParam(required = false) String status) {
    boolean isArchive = "1".equals(archive) || "true".equalsIgnoreCase(archive);
    return events.list(page, limit, q, category, city, isArchive, status, AuthSupport.optionalUser());
  }

  @GetMapping("/meta/categories")
  public List<String> categories() {
    return events.categories();
  }

  @GetMapping("/{id}")
  public EventDtos.EventResponse get(@PathVariable String id) {
    return events.get(id, AuthSupport.optionalUser());
  }

  @PostMapping
  public EventDtos.EventResponse create(@Valid @RequestBody EventDtos.CreateEventRequest req) {
    return events.create(req, AuthSupport.requireUser());
  }

  @PatchMapping("/{id}")
  public EventDtos.EventResponse patch(@PathVariable String id, @RequestBody EventDtos.PatchEventRequest req) {
    return events.patch(id, req, AuthSupport.requireUser());
  }
}
