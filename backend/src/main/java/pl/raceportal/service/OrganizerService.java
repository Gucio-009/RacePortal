package pl.raceportal.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.AdminDtos;
import pl.raceportal.web.dto.EventDtos;

@Service
public class OrganizerService {
  private final OrganizerApplicationRepository applications;
  private final EventRepository events;
  private final RegistrationRepository registrations;
  private final UserRepository users;
  private final EventService eventService;
  private final MailService mail;

  public OrganizerService(
      OrganizerApplicationRepository applications,
      EventRepository events,
      RegistrationRepository registrations,
      UserRepository users,
      EventService eventService,
      MailService mail) {
    this.applications = applications;
    this.events = events;
    this.registrations = registrations;
    this.users = users;
    this.eventService = eventService;
    this.mail = mail;
  }

  @Transactional
  public Map<String, Object> apply(AdminDtos.ApplyRequest req, UserPrincipal principal) {
    if (principal.getRole() == Role.ORGANIZER || principal.getRole() == Role.ADMIN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Masz już uprawnienia organizatora");
    }
    User user = users.findById(principal.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie"));
    OrganizerApplication app = new OrganizerApplication();
    app.setUser(user);
    app.setCompany(req.company());
    app.setMessage(req.message());
    app.setStatus(RegistrationStatus.PENDING);
    applications.save(app);
    mail.send(principal.getEmail(), "Wniosek o rolę organizatora", "Wniosek wysłany i czeka na decyzję admina.");
    Map<String, Object> m = new HashMap<>();
    m.put("id", app.getId());
    m.put("company", app.getCompany());
    m.put("message", app.getMessage());
    m.put("status", app.getStatus().name());
    return m;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> myEvents(UserPrincipal principal) {
    List<Event> list = principal.getRole() == Role.ADMIN
        ? events.findAllByOrderByDateDesc()
        : events.findByOrganizer_IdOrderByDateDesc(principal.getId());
    return list.stream().map(e -> {
      EventDtos.EventResponse base = eventService.serialize(e, true);
      Map<String, Object> m = new HashMap<>();
      m.put("id", base.id());
      m.put("name", base.name());
      m.put("description", base.description());
      m.put("category", base.category());
      m.put("date", base.date());
      m.put("dateLabel", base.dateLabel());
      m.put("time", base.time());
      m.put("track", base.track());
      m.put("city", base.city());
      m.put("voivodeship", base.voivodeship());
      m.put("imageUrl", base.imageUrl());
      m.put("lat", base.lat());
      m.put("lng", base.lng());
      m.put("status", base.status());
      m.put("organizerId", base.organizerId());
      m.put("registrationsCount", base.registrationsCount());
      m.put("_count", Map.of("registrations", registrations.countByEvent_Id(e.getId())));
      return m;
    }).toList();
  }
}
