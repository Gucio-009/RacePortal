package pl.raceportal.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.RegistrationDtos;

@Service
public class RegistrationService {
  private final RegistrationRepository registrations;
  private final EventRepository events;
  private final CarRepository cars;
  private final UserRepository users;
  private final EventService eventService;
  private final MailService mail;

  public RegistrationService(
      RegistrationRepository registrations,
      EventRepository events,
      CarRepository cars,
      UserRepository users,
      EventService eventService,
      MailService mail) {
    this.registrations = registrations;
    this.events = events;
    this.cars = cars;
    this.users = users;
    this.eventService = eventService;
    this.mail = mail;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> mine(UserPrincipal principal) {
    return registrations.findByUser_IdOrderByCreatedAtDesc(principal.getId()).stream()
        .map(this::toRich)
        .toList();
  }

  @Transactional
  public Map<String, Object> create(RegistrationDtos.CreateRegistrationRequest req, UserPrincipal principal) {
    Event event = events.findById(req.eventId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    if (event.getStatus() != EventStatus.APPROVED) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Wydarzenie nie przyjmuje zgłoszeń");
    }
    User user = users.findById(principal.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie"));
    Car car = null;
    if (req.carId() != null && !req.carId().isBlank()) {
      car = cars.findById(req.carId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono auta"));
      if (!car.getUser().getId().equals(principal.getId())) {
        throw new ApiException(HttpStatus.FORBIDDEN, "Brak uprawnień do auta");
      }
    }
    Registration reg = registrations.findByUser_IdAndEvent_Id(principal.getId(), event.getId())
        .orElseGet(Registration::new);
    reg.setUser(user);
    reg.setEvent(event);
    reg.setCar(car);
    reg.setNote(req.note());
    reg.setStatus(RegistrationStatus.PENDING);
    registrations.save(reg);
    mail.send(principal.getEmail(), "Zgłoszenie RACEPORTAL", "Zgłoszenie na " + event.getName() + " wysłane.");
    return toRich(reg);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> byEvent(String eventId, UserPrincipal principal) {
    Event event = events.findById(eventId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    ensureOrgAccess(event, principal);
    return registrations.findByEvent_IdOrderByCreatedAtDesc(eventId).stream().map(this::toRichWithUser).toList();
  }

  @Transactional
  public Map<String, Object> updateStatus(String id, RegistrationStatus status, UserPrincipal principal) {
    Registration reg = registrations.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono zgłoszenia"));
    Event event = reg.getEvent();
    ensureOrgAccess(event, principal);
    reg.setStatus(status);
    registrations.save(reg);
    mail.send(reg.getUser().getEmail(), "Status zgłoszenia", "Status zgłoszenia: " + status.name());
    return toRich(reg);
  }

  private void ensureOrgAccess(Event event, UserPrincipal principal) {
    String organizerId = event.getOrganizer() == null ? null : event.getOrganizer().getId();
    boolean ok = principal.getRole() == Role.ADMIN
        || (principal.getRole() == Role.ORGANIZER && principal.getId().equals(organizerId));
    if (!ok) throw new ApiException(HttpStatus.FORBIDDEN, "Brak uprawnień");
  }

  private Map<String, Object> toRich(Registration reg) {
    Map<String, Object> m = base(reg);
    m.put("event", eventService.serialize(reg.getEvent(), false));
    if (reg.getCar() != null) {
      Car c = reg.getCar();
      Map<String, Object> car = new HashMap<>();
      car.put("id", c.getId());
      car.put("make", c.getMake());
      car.put("model", c.getModel());
      car.put("year", c.getYear());
      car.put("className", c.getClassName());
      m.put("car", car);
    }
    return m;
  }

  private Map<String, Object> toRichWithUser(Registration reg) {
    Map<String, Object> m = toRich(reg);
    User u = reg.getUser();
    m.put("user", new RegistrationDtos.UserBrief(u.getId(), u.getUsername(), u.getEmail(), u.getAvatar()));
    return m;
  }

  private Map<String, Object> base(Registration reg) {
    Map<String, Object> m = new HashMap<>();
    m.put("id", reg.getId());
    m.put("userId", reg.getUser().getId());
    m.put("eventId", reg.getEvent().getId());
    m.put("carId", reg.getCar() == null ? null : reg.getCar().getId());
    m.put("status", reg.getStatus().name());
    m.put("note", reg.getNote());
    m.put("createdAt", reg.getCreatedAt().toString());
    m.put("updatedAt", reg.getUpdatedAt().toString());
    return m;
  }
}
