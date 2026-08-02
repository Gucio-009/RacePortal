package pl.raceportal.service;

import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.EventDtos.EventCreateRequest;
import pl.raceportal.dto.EventDtos.EventListResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.EventDtos.EventUpdateRequest;
import pl.raceportal.dto.EventDtos.OrganizerRef;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class EventService {

    private static final DateTimeFormatter POLISH_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("pl", "PL"));
    private static final Locale POLISH_LOCALE = Locale.forLanguageTag("pl-PL");
    private static final List<RegistrationStatus> CANCELABLE_ON_EVENT_CANCEL = List.of(
            RegistrationStatus.PENDING, RegistrationStatus.ACCEPTED, RegistrationStatus.CONFIRMED);

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    public EventService(EventRepository eventRepository, RegistrationRepository registrationRepository,
                         UserRepository userRepository, MailService mailService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    @Transactional(readOnly = true)
    public EventListResponse list(int pageParam, int limitParam, String q, String category, String city,
                                   boolean archive, String statusParam, String paidParam,
                                   UserPrincipal currentUser) {
        int page = Math.max(1, pageParam);
        int limit = Math.min(50, Math.max(1, limitParam));
        LocalDate startOfToday = LocalDate.now();
        Boolean paidFilter = parsePaidFilter(paidParam);

        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (currentUser != null && currentUser.getRole() == Role.ADMIN && statusParam != null && !statusParam.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"), EventStatus.valueOf(statusParam.toUpperCase(Locale.ROOT))));
                } catch (IllegalArgumentException ignored) {
                    // unknown status value -> ignore filter, behave like "all"
                }
            } else if (currentUser != null && currentUser.getRole() == Role.ORGANIZER && "mine".equals(statusParam)) {
                predicates.add(cb.equal(root.get("organizer").get("id"), currentUser.getId()));
            } else if (archive) {
                predicates.add(cb.or(
                        cb.equal(root.get("status"), EventStatus.ARCHIVED),
                        cb.and(cb.equal(root.get("status"), EventStatus.APPROVED), cb.lessThan(root.get("date"), startOfToday))
                ));
            } else {
                predicates.add(cb.equal(root.get("status"), EventStatus.APPROVED));
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startOfToday));
            }

            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("track")), like),
                        cb.like(cb.lower(root.get("city")), like),
                        cb.like(cb.lower(root.get("category")), like)
                ));
            }
            if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (city != null && !city.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase(Locale.ROOT) + "%"));
            }
            if (paidFilter != null) {
                predicates.add(cb.equal(root.get("paid"), paidFilter));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(archive ? Sort.Direction.DESC : Sort.Direction.ASC, "date");
        var pageResult = eventRepository.findAll(spec, PageRequest.of(page - 1, limit, sort));

        List<EventResponse> items = pageResult.getContent().stream().map(this::serialize).toList();

        return new EventListResponse(page, limit, pageResult.getTotalElements(),
                pageResult.getTotalPages(), items);
    }

    private static Boolean parsePaidFilter(String paidParam) {
        if (paidParam == null || paidParam.isBlank() || "all".equalsIgnoreCase(paidParam)) {
            return null;
        }
        if ("1".equals(paidParam) || "true".equalsIgnoreCase(paidParam) || "paid".equalsIgnoreCase(paidParam)) {
            return true;
        }
        if ("0".equals(paidParam) || "false".equalsIgnoreCase(paidParam) || "free".equalsIgnoreCase(paidParam)) {
            return false;
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<String> categories() {
        return eventRepository.findByStatusInOrderByCategoryAsc(List.of(EventStatus.APPROVED, EventStatus.ARCHIVED))
                .stream()
                .map(Event::getCategory)
                .distinct()
                .sorted()
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getById(String id, UserPrincipal currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wydarzenia"));

        boolean privileged = currentUser != null && (currentUser.getRole() == Role.ADMIN ||
                (currentUser.getRole() == Role.ORGANIZER && event.getOrganizer() != null
                        && event.getOrganizer().getId().equals(currentUser.getId())));

        if (event.getStatus() != EventStatus.APPROVED && event.getStatus() != EventStatus.ARCHIVED && !privileged) {
            throw ApiException.notFound("Nie znaleziono wydarzenia");
        }

        return serialize(event);
    }

    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public EventResponse create(EventCreateRequest request, UserPrincipal currentUser) {
        User organizer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        Event event = new Event();
        event.setName(request.name());
        event.setDescription(request.description());
        event.setCategory(request.category());
        event.setDate(parseDate(request.date()));
        event.setTime(request.time());
        event.setTrack(request.track());
        event.setCity(request.city());
        event.setVoivodeship(request.voivodeship());
        event.setImageUrl((request.imageUrl() == null || request.imageUrl().isBlank()) ? null : request.imageUrl());
        event.setLat(request.lat());
        event.setLng(request.lng());
        event.setStatus(currentUser.getRole() == Role.ADMIN ? EventStatus.APPROVED : EventStatus.PENDING);
        event.setOrganizer(organizer);
        event.setPaid(request.paid());
        event.setEntryFee(request.paid() ? request.entryFee() : null);
        event.setBankAccount(request.paid() ? request.bankAccount() : null);
        if (request.paymentDeadlineHours() != null) event.setPaymentDeadlineHours(request.paymentDeadlineHours());
        if (request.freeCancelDays() != null) event.setFreeCancelDays(request.freeCancelDays());
        if (request.acceptRegistrations() != null) event.setAcceptRegistrations(request.acceptRegistrations());

        event = eventRepository.save(event);
        return serialize(event);
    }

    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public EventResponse update(String id, EventUpdateRequest request, UserPrincipal currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }

        if (request.name() != null) event.setName(request.name());
        if (request.description() != null) event.setDescription(request.description());
        if (request.category() != null) event.setCategory(request.category());
        if (request.date() != null) event.setDate(parseDate(request.date()));
        if (request.time() != null) event.setTime(request.time());
        if (request.track() != null) event.setTrack(request.track());
        if (request.city() != null) event.setCity(request.city());
        if (request.voivodeship() != null) event.setVoivodeship(request.voivodeship());
        if (request.imageUrl() != null) event.setImageUrl(request.imageUrl().isBlank() ? null : request.imageUrl());
        if (request.lat() != null) event.setLat(request.lat());
        if (request.lng() != null) event.setLng(request.lng());
        if (request.paid() != null) event.setPaid(request.paid());
        if (request.entryFee() != null) event.setEntryFee(event.isPaid() ? request.entryFee() : null);
        if (request.bankAccount() != null) event.setBankAccount(event.isPaid() ? request.bankAccount() : null);
        if (request.paymentDeadlineHours() != null) event.setPaymentDeadlineHours(request.paymentDeadlineHours());
        if (request.freeCancelDays() != null) event.setFreeCancelDays(request.freeCancelDays());
        if (request.acceptRegistrations() != null) event.setAcceptRegistrations(request.acceptRegistrations());
        if (!event.isPaid()) {
            event.setEntryFee(null);
            event.setBankAccount(null);
        }

        if (currentUser.getRole() == Role.ORGANIZER) {
            event.setStatus(EventStatus.PENDING);
        }

        event = eventRepository.save(event);
        EventResponse response = serialize(event);

        notifyRegisteredDriversOfChange(event);

        return response;
    }

    /**
     * Diagram "Proces anulowania wydarzenia (organizator)": the organizer (or an
     * admin) cancels the whole event, every open registration is forced to
     * CANCELED, and every affected driver is emailed — mentioning a refund by
     * the organizer when the event was paid.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public EventResponse cancelEvent(String id, UserPrincipal currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }

        event.setStatus(EventStatus.CANCELLED);
        event = eventRepository.save(event);

        List<Registration> registrations = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(event.getId());
        for (Registration registration : registrations) {
            if (CANCELABLE_ON_EVENT_CANCEL.contains(registration.getStatus())) {
                registration.setStatus(RegistrationStatus.CANCELED);
                registrationRepository.save(registration);
            }
            String refundNote = event.isPaid()
                    ? "<p>Jeśli dokonałeś/aś już płatności, zwrot środków zostanie zrealizowany przez organizatora.</p>"
                    : "";
            mailService.send(registration.getUser().getEmail(), "Wydarzenie anulowane: " + event.getName(),
                    "<p>Wydarzenie <strong>" + event.getName() + "</strong> zostało anulowane przez organizatora, " +
                            "a Twoje zgłoszenie otrzymało status <strong>CANCELED</strong>.</p>" + refundNote);
        }

        return serialize(event);
    }

    private void notifyRegisteredDriversOfChange(Event event) {
        List<Registration> registrations = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(event.getId());
        for (Registration registration : registrations) {
            mailService.send(registration.getUser().getEmail(), "Zmiany w wydarzeniu: " + event.getName(),
                    "<p>Organizator zaktualizował informacje o wydarzeniu <strong>" + event.getName() +
                            "</strong>, na które jesteś zgłoszony/a.</p>");
        }
    }

    private LocalDate parseDate(String raw) {
        try {
            return LocalDate.parse(raw);
        } catch (DateTimeException ignored) {
            // fall through to alternative parsing
        }
        try {
            return OffsetDateTime.parse(raw).toLocalDate();
        } catch (DateTimeException ignored) {
            // fall through to alternative parsing
        }
        try {
            return Instant.parse(raw).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (DateTimeException e) {
            throw ApiException.badRequest("Nieprawidłowy format daty");
        }
    }

    EventResponse serialize(Event event) {
        long registrationsCount = registrationRepository.countByEvent_Id(event.getId());
        OrganizerRef organizerRef = event.getOrganizer() != null
                ? new OrganizerRef(event.getOrganizer().getId(), event.getOrganizer().getUsername())
                : null;

        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getCategory(),
                event.getDate().atStartOfDay(ZoneOffset.UTC).toInstant().toString(),
                event.getDate().format(POLISH_DATE_FORMATTER).toUpperCase(POLISH_LOCALE),
                event.getTime(),
                event.getTrack(),
                event.getCity(),
                event.getVoivodeship(),
                event.getImageUrl(),
                event.getLat(),
                event.getLng(),
                event.getStatus().name(),
                event.getOrganizer() != null ? event.getOrganizer().getId() : null,
                organizerRef,
                registrationsCount,
                event.isPaid(),
                event.getEntryFee(),
                event.getBankAccount(),
                event.getPaymentDeadlineHours(),
                event.getFreeCancelDays(),
                event.isAcceptRegistrations()
        );
    }
}
