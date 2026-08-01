package pl.raceportal.service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.EventDtos;

@Service
public class EventService {
  private static final DateTimeFormatter DATE_LABEL =
      DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("pl-PL"));

  private final EventRepository events;
  private final UserRepository users;
  private final RegistrationRepository registrations;

  public EventService(EventRepository events, UserRepository users, RegistrationRepository registrations) {
    this.events = events;
    this.users = users;
    this.registrations = registrations;
  }

  @Transactional(readOnly = true)
  public EventDtos.EventResponse serialize(Event event, boolean withCount) {
    EventDtos.OrganizerBrief org = null;
    User organizer = event.getOrganizer();
    if (organizer != null) {
      org = new EventDtos.OrganizerBrief(organizer.getId(), organizer.getUsername());
    }
    Long count = withCount ? registrations.countByEvent_Id(event.getId()) : null;
    String organizerId = organizer == null ? null : organizer.getId();
    return new EventDtos.EventResponse(
        event.getId(),
        event.getName(),
        event.getDescription(),
        event.getCategory(),
        event.getDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC).toString(),
        event.getDate().format(DATE_LABEL).toUpperCase(Locale.ROOT),
        event.getTime(),
        event.getTrack(),
        event.getCity(),
        event.getVoivodeship(),
        event.getImageUrl(),
        event.getLat(),
        event.getLng(),
        event.getStatus().name(),
        organizerId,
        org,
        count);
  }

  @Transactional(readOnly = true)
  public EventDtos.EventPageResponse list(
      int page, int limit, String q, String category, String city, boolean archive, String statusParam, UserPrincipal principal) {
    int p = Math.max(1, page);
    int lim = Math.min(50, Math.max(1, limit));
    LocalDate today = LocalDate.now();

    Specification<Event> spec = (root, query, cb) -> {
      List<Predicate> preds = new ArrayList<>();
      if (principal != null && principal.getRole() == Role.ADMIN && statusParam != null && !statusParam.isBlank()) {
        preds.add(cb.equal(root.get("status"), EventStatus.valueOf(statusParam)));
      } else if (principal != null && principal.getRole() == Role.ORGANIZER && "mine".equals(statusParam)) {
        preds.add(cb.equal(root.get("organizer").get("id"), principal.getId()));
      } else if (archive) {
        preds.add(cb.or(
            cb.equal(root.get("status"), EventStatus.ARCHIVED),
            cb.and(cb.equal(root.get("status"), EventStatus.APPROVED), cb.lessThan(root.get("date"), today))));
      } else {
        preds.add(cb.equal(root.get("status"), EventStatus.APPROVED));
        preds.add(cb.greaterThanOrEqualTo(root.get("date"), today));
      }
      if (q != null && !q.isBlank()) {
        String like = "%" + q.toLowerCase(Locale.ROOT) + "%";
        preds.add(cb.or(
            cb.like(cb.lower(root.get("name")), like),
            cb.like(cb.lower(root.get("track")), like),
            cb.like(cb.lower(root.get("city")), like),
            cb.like(cb.lower(root.get("category")), like)));
      }
      if (category != null && !category.isBlank() && !"all".equals(category)) {
        preds.add(cb.equal(root.get("category"), category));
      }
      if (city != null && !city.isBlank()) {
        preds.add(cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase(Locale.ROOT) + "%"));
      }
      return cb.and(preds.toArray(new Predicate[0]));
    };

    Sort sort = archive ? Sort.by(Sort.Direction.DESC, "date") : Sort.by(Sort.Direction.ASC, "date");
    Page<Event> result = events.findAll(spec, PageRequest.of(p - 1, lim, sort));
    List<EventDtos.EventResponse> items = result.getContent().stream().map(e -> serialize(e, true)).toList();
    return new EventDtos.EventPageResponse(p, lim, result.getTotalElements(), result.getTotalPages(), items);
  }

  @Transactional(readOnly = true)
  public EventDtos.EventResponse get(String id, UserPrincipal principal) {
    Event event = events.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    boolean publicOk = event.getStatus() == EventStatus.APPROVED || event.getStatus() == EventStatus.ARCHIVED;
    if (!publicOk) {
      String organizerId = event.getOrganizer() == null ? null : event.getOrganizer().getId();
      boolean allowed = principal != null && (principal.getRole() == Role.ADMIN
          || (principal.getRole() == Role.ORGANIZER && principal.getId().equals(organizerId)));
      if (!allowed) throw new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia");
    }
    return serialize(event, true);
  }

  @Transactional(readOnly = true)
  public List<String> categories() {
    return events.findAll().stream().map(Event::getCategory).distinct().sorted().toList();
  }

  @Transactional
  public EventDtos.EventResponse create(EventDtos.CreateEventRequest req, UserPrincipal principal) {
    if (principal.getRole() != Role.ORGANIZER && principal.getRole() != Role.ADMIN) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Brak uprawnień");
    }
    User organizer = users.findById(principal.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie"));
    Event event = new Event();
    applyCreate(event, req);
    event.setOrganizer(organizer);
    event.setStatus(principal.getRole() == Role.ADMIN ? EventStatus.APPROVED : EventStatus.PENDING);
    events.save(event);
    return serialize(event, true);
  }

  @Transactional
  public EventDtos.EventResponse patch(String id, EventDtos.PatchEventRequest req, UserPrincipal principal) {
    Event event = events.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    String organizerId = event.getOrganizer() == null ? null : event.getOrganizer().getId();
    boolean admin = principal.getRole() == Role.ADMIN;
    boolean owner = principal.getRole() == Role.ORGANIZER && principal.getId().equals(organizerId);
    if (!admin && !owner) throw new ApiException(HttpStatus.FORBIDDEN, "Brak uprawnień");
    if (req.name() != null) event.setName(req.name());
    if (req.description() != null) event.setDescription(req.description());
    if (req.category() != null) event.setCategory(req.category());
    if (req.date() != null) event.setDate(LocalDate.parse(req.date().substring(0, 10)));
    if (req.time() != null) event.setTime(req.time());
    if (req.track() != null) event.setTrack(req.track());
    if (req.city() != null) event.setCity(req.city());
    if (req.voivodeship() != null) event.setVoivodeship(req.voivodeship());
    if (req.imageUrl() != null) event.setImageUrl(req.imageUrl());
    if (req.lat() != null) event.setLat(req.lat());
    if (req.lng() != null) event.setLng(req.lng());
    if (owner && !admin) event.setStatus(EventStatus.PENDING);
    events.save(event);
    return serialize(event, true);
  }

  private void applyCreate(Event event, EventDtos.CreateEventRequest req) {
    event.setName(req.name());
    event.setDescription(req.description());
    event.setCategory(req.category());
    event.setDate(LocalDate.parse(req.date().substring(0, Math.min(10, req.date().length()))));
    event.setTime(req.time());
    event.setTrack(req.track());
    event.setCity(req.city());
    event.setVoivodeship(req.voivodeship());
    event.setImageUrl(req.imageUrl());
    event.setLat(req.lat());
    event.setLng(req.lng());
  }
}
