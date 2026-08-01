package pl.raceportal.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.AdminDtos;
import pl.raceportal.web.dto.AuthDtos;

@Service
public class AdminService {
  private final UserRepository users;
  private final EventRepository events;
  private final RegistrationRepository registrations;
  private final OrganizerApplicationRepository applications;
  private final EventService eventService;
  private final AuthService authService;
  private final MailService mail;

  public AdminService(
      UserRepository users,
      EventRepository events,
      RegistrationRepository registrations,
      OrganizerApplicationRepository applications,
      EventService eventService,
      AuthService authService,
      MailService mail) {
    this.users = users;
    this.events = events;
    this.registrations = registrations;
    this.applications = applications;
    this.eventService = eventService;
    this.authService = authService;
    this.mail = mail;
  }

  @Transactional(readOnly = true)
  public AdminDtos.StatsResponse stats() {
    return new AdminDtos.StatsResponse(
        users.count(),
        events.count(),
        events.countByStatus(EventStatus.PENDING),
        registrations.count(),
        applications.countByStatus(RegistrationStatus.PENDING));
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listUsers() {
    return users.findAllByOrderByCreatedAtDesc().stream().map(u -> {
      Map<String, Object> m = new HashMap<>();
      m.put("id", u.getId());
      m.put("email", u.getEmail());
      m.put("username", u.getUsername());
      m.put("role", u.getRole().name());
      m.put("avatar", u.getAvatar());
      m.put("createdAt", u.getCreatedAt().toString());
      return m;
    }).toList();
  }

  @Transactional
  public AuthDtos.UserResponse updateRole(String id, Role role) {
    User user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));
    user.setRole(role);
    users.save(user);
    mail.send(user.getEmail(), "Zmiana roli", "Twoja rola: " + role.name());
    return authService.toUserResponse(user);
  }

  @Transactional(readOnly = true)
  public List<?> pendingEvents() {
    return events.findByStatusOrderByCreatedAtAsc(EventStatus.PENDING).stream()
        .map(e -> eventService.serialize(e, true))
        .toList();
  }

  @Transactional
  public Object updateEventStatus(String id, EventStatus status) {
    Event event = events.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    event.setStatus(status);
    events.save(event);
    return eventService.serialize(event, true);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> applications() {
    return applications.findAllByOrderByCreatedAtDesc().stream().map(app -> {
      Map<String, Object> m = new HashMap<>();
      m.put("id", app.getId());
      m.put("userId", app.getUser().getId());
      m.put("company", app.getCompany());
      m.put("message", app.getMessage());
      m.put("status", app.getStatus().name());
      m.put("createdAt", app.getCreatedAt().toString());
      User u = app.getUser();
      m.put("user", Map.of("id", u.getId(), "username", u.getUsername(), "email", u.getEmail()));
      return m;
    }).toList();
  }

  @Transactional
  public Map<String, Object> updateApplication(String id, RegistrationStatus status) {
    if (status != RegistrationStatus.APPROVED && status != RegistrationStatus.REJECTED) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Niedozwolony status");
    }
    OrganizerApplication app = applications.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wniosku"));
    app.setStatus(status);
    applications.save(app);
    User user = app.getUser();
    if (status == RegistrationStatus.APPROVED) {
      user.setRole(Role.ORGANIZER);
      users.save(user);
    }
    mail.send(user.getEmail(), "Wniosek organizatora", "Status: " + status.name());
    Map<String, Object> m = new HashMap<>();
    m.put("id", app.getId());
    m.put("status", app.getStatus().name());
    return m;
  }
}
