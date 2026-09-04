package pl.raceportal.service;

import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.EventDtos.EventCreateRequest;
import pl.raceportal.dto.EventDtos.EventListResponse;
import pl.raceportal.dto.EventDtos.EventMarkerResponse;
import pl.raceportal.dto.EventDtos.EventMarkersResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.EventDtos.EventUpdateRequest;
import pl.raceportal.dto.EventDtos.OrganizerRef;
import pl.raceportal.repository.CarRepository;
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
import java.util.Map;

/**
 * Serwis wydarzeń: listy z filtrami, markery mapy, CRUD organizatora, anulowanie.
 * <p>
 * Rola w architekturze: publiczne API katalogu imprez + panel organizatora.
 * Filtry budowane przez JPA Specification; dopasowanie pojazdu przez {@link CategoryMatcher}.
 * Technologie: Spring Data JPA (Specification, paging), Spring Cache, Mail, MySQL.
 * </p>
 * Widoczność: publicznie APPROVED z datą ≥ dziś (lub archiwum); ORGANIZER/ADMIN
 * widzą także PENDING/inne własne. Tworzenie: ORGANIZER → PENDING, ADMIN → APPROVED.
 * Edycja przez organizatora wraca do PENDING (ponowna moderacja).
 * <p>
 * Pomysł (alt): Elasticsearch; Redis cache odpowiedzi list; MapStruct do DTO;
 * PostGIS do filtrów geo.
 * </p>
 */
@Service
public class EventService {

    private static final DateTimeFormatter POLISH_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("pl", "PL"));
    private static final Locale POLISH_LOCALE = Locale.forLanguageTag("pl-PL");
    /** Statusy zgłoszeń anulowane przy CANCELLED wydarzenia. */
    private static final List<RegistrationStatus> CANCELABLE_ON_EVENT_CANCEL = List.of(
            RegistrationStatus.PENDING, RegistrationStatus.ACCEPTED, RegistrationStatus.CONFIRMED);

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final MailService mailService;

    public EventService(EventRepository eventRepository, RegistrationRepository registrationRepository,
                         UserRepository userRepository, CarRepository carRepository, MailService mailService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.mailService = mailService;
    }

    /**
     * Stronicowana lista wydarzeń z filtrami (q, kategoria, miasto, województwo, tor,
     * zakres dat, archive, paid, status dla admin/org, carId → CategoryMatcher).
     */
    @Transactional(readOnly = true)
    public EventListResponse list(int pageParam, int limitParam, String q, String category, String city,
                                   String voivodeship, String track, String dateFrom, String dateTo,
                                   boolean archive, String statusParam, String paidParam, String carId,
                                   UserPrincipal currentUser) {
        int page = Math.max(1, pageParam);
        int limit = Math.min(50, Math.max(1, limitParam));
        LocalDate startOfToday = LocalDate.now();
        Boolean paidFilter = parsePaidFilter(paidParam);
        LocalDate from = parseFilterDate(dateFrom);
        LocalDate to = parseFilterDate(dateTo);

        String carClass = null;
        if (carId != null && !carId.isBlank() && currentUser != null) {
            carClass = carRepository.findByIdAndUser_Id(carId, currentUser.getId())
                    .map(Car::getClassName)
                    .orElse(null);
        }
        final String matchCarClass = carClass;

        Specification<Event> spec = buildListSpec(q, category, city, voivodeship, track, from, to,
                archive, statusParam, paidFilter, startOfToday, currentUser);

        Sort sort = Sort.by(archive ? Sort.Direction.DESC : Sort.Direction.ASC, "date");
        // When filtering by car, fetch a wider page then filter in memory (category match is fuzzy).
        int fetchLimit = matchCarClass != null ? Math.min(200, limit * 10) : limit;
        var pageResult = eventRepository.findAll(spec, PageRequest.of(page - 1, fetchLimit, sort));

        List<EventResponse> items = pageResult.getContent().stream()
                .filter(e -> matchCarClass == null || CategoryMatcher.matches(matchCarClass, e.getCategory()))
                .limit(limit)
                .map(this::serialize)
                .toList();

        // Fuzzy CategoryMatcher nie da się w SQL Spec — dokładny total przez skan stronami (bez findAll całej tabeli).
        long total = matchCarClass != null
                ? countMatchingCarClass(spec, sort, matchCarClass)
                : pageResult.getTotalElements();
        long totalPages = Math.max(1, (long) Math.ceil(total / (double) limit));

        return new EventListResponse(page, limit, total, totalPages, items);
    }

    /**
     * Pełny zestaw filtrów dla mapy/kalendarza (slim DTO, bez limitu strony listy).
     * Wydarzenia bez GPS też wracają — mapa filtruje po stronie klienta.
     */
    @Transactional(readOnly = true)
    public EventMarkersResponse listMarkers(String q, String category, String city,
                                             String voivodeship, String track, String dateFrom, String dateTo,
                                             boolean archive, String statusParam, String paidParam, String carId,
                                             UserPrincipal currentUser) {
        Boolean paidFilter = parsePaidFilter(paidParam);
        LocalDate from = parseFilterDate(dateFrom);
        LocalDate to = parseFilterDate(dateTo);
        LocalDate startOfToday = LocalDate.now();

        String carClass = null;
        if (carId != null && !carId.isBlank() && currentUser != null) {
            carClass = carRepository.findByIdAndUser_Id(carId, currentUser.getId())
                    .map(Car::getClassName)
                    .orElse(null);
        }
        final String matchCarClass = carClass;

        Specification<Event> spec = buildListSpec(q, category, city, voivodeship, track, from, to,
                archive, statusParam, paidFilter, startOfToday, currentUser);

        Sort sort = Sort.by(archive ? Sort.Direction.DESC : Sort.Direction.ASC, "date");
        List<Event> all = eventRepository.findAll(spec, sort);

        List<EventMarkerResponse> items = all.stream()
                .filter(e -> matchCarClass == null || CategoryMatcher.matches(matchCarClass, e.getCategory()))
                .limit(MARKERS_MAX)
                .map(this::serializeMarker)
                .toList();

        return new EventMarkersResponse(items.size(), items);
    }

    private static final int MARKERS_MAX = 5000;

    /**
     * Buduje Specification filtrów: status (publiczny / archive / admin / mine),
     * wyszukiwanie tekstowe, lokalizacja, daty, płatność.
     */
    private Specification<Event> buildListSpec(String q, String category, String city, String voivodeship,
                                                String track, LocalDate from, LocalDate to, boolean archive,
                                                String statusParam, Boolean paidFilter, LocalDate startOfToday,
                                                UserPrincipal currentUser) {
        return (root, query, cb) -> {
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
            if (voivodeship != null && !voivodeship.isBlank() && !"all".equalsIgnoreCase(voivodeship)) {
                predicates.add(cb.equal(root.get("voivodeship"), voivodeship));
            }
            if (track != null && !track.isBlank() && !"all".equalsIgnoreCase(track)) {
                predicates.add(cb.like(cb.lower(root.get("track")), "%" + track.toLowerCase(Locale.ROOT) + "%"));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), to));
            }
            if (paidFilter != null) {
                predicates.add(cb.equal(root.get("paid"), paidFilter));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EventMarkerResponse serializeMarker(Event event) {
        return new EventMarkerResponse(
                event.getId(),
                event.getName(),
                event.getCategory(),
                event.getDate().atStartOfDay(ZoneOffset.UTC).toInstant().toString(),
                event.getDate().format(POLISH_DATE_FORMATTER).toUpperCase(POLISH_LOCALE),
                event.getTime(),
                event.getTrack(),
                event.getCity(),
                event.getLat(),
                event.getLng(),
                event.isPaid(),
                event.getEntryFee(),
                event.getImageUrl()
        );
    }

    private static LocalDate parseFilterDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeException e) {
            return null;
        }
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

    /** Dokładny count po fuzzy CategoryMatcher — skan Spec stronami (bez ładowania całej tabeli naraz). */
    private long countMatchingCarClass(Specification<Event> spec, Sort sort, String matchCarClass) {
        final int scanSize = 500;
        long matched = 0;
        int scanPage = 0;
        Page<Event> scan;
        do {
            scan = eventRepository.findAll(spec, PageRequest.of(scanPage++, scanSize, sort));
            matched += scan.getContent().stream()
                    .filter(e -> CategoryMatcher.matches(matchCarClass, e.getCategory()))
                    .count();
        } while (scan.hasNext());
        return matched;
    }

    @Transactional(readOnly = true)
    public List<String> categories() {
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>(dictionaryCategories());
        eventRepository.findByStatusInOrderByCategoryAsc(List.of(EventStatus.APPROVED, EventStatus.ARCHIVED))
                .stream()
                .map(Event::getCategory)
                .forEach(set::add);
        return set.stream().sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> categoryGroups() {
        return categoryGroupsStatic();
    }

    private static List<String> dictionaryCategories() {
        return categoryGroupsStatic().stream()
                .flatMap(g -> ((List<?>) g.get("items")).stream())
                .map(Object::toString)
                .toList();
    }

    private static List<Map<String, Object>> categoryGroupsStatic() {
        return List.of(
                Map.of("group", "Rajdy", "items", List.of("Rajdy", "KJS", "RallySprint", "SuperOES", "Super Sprint", "RSMP", "SKJS", "HRSMP")),
                Map.of("group", "Wyścigi", "items", List.of("Wyścigi górskie", "Rallycross", "Wrak race", "Time Attack", "Track Day", "Drag race", "Sprint", "GT Racing", "Endurance", "MPWS", "Racing")),
                Map.of("group", "Drift", "items", List.of("Drift", "Drift trening", "Drift amatorskie", "Drift pro")),
                Map.of("group", "Inne", "items", List.of("Inne"))
        );
    }

    /**
     * Szczegóły wydarzenia: PENDING/REJECTED widoczne tylko dla właściciela/admina
     * (inaczej 404 — nie ujawnia istnienia nieopublikowanych).
     */
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

    /**
     * Tworzenie wydarzenia: ORGANIZER → status PENDING (moderacja);
     * ADMIN → od razu APPROVED. Invaliduje cache list.
     */
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
        applyOptionalEventFields(event, request.endDate(), request.endTime(), request.street(),
                request.spectatorFee(), request.externalUrl(), request.requireDrivingLicense(),
                request.requirePzmLicense(), request.requireOc(), request.requirePt(),
                request.requireCage(), request.requireRegistered());

        event = eventRepository.save(event);
        return serialize(event);
    }

    /**
     * Aktualizacja wydarzenia (ownership RBAC). Edycja przez ORGANIZER
     * ustawia ponownie PENDING; powiadamia zgłoszonych zawodników mailem.
     */
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
        if (request.endDate() != null) event.setEndDate(parseOptionalDate(request.endDate()));
        if (request.endTime() != null) event.setEndTime(request.endTime().isBlank() ? null : request.endTime());
        if (request.street() != null) event.setStreet(request.street().isBlank() ? null : request.street());
        if (request.spectatorFee() != null) event.setSpectatorFee(request.spectatorFee());
        if (request.externalUrl() != null) event.setExternalUrl(request.externalUrl().isBlank() ? null : request.externalUrl());
        if (request.requireDrivingLicense() != null) event.setRequireDrivingLicense(request.requireDrivingLicense());
        if (request.requirePzmLicense() != null) event.setRequirePzmLicense(request.requirePzmLicense());
        if (request.requireOc() != null) event.setRequireOc(request.requireOc());
        if (request.requirePt() != null) event.setRequirePt(request.requirePt());
        if (request.requireCage() != null) event.setRequireCage(request.requireCage());
        if (request.requireRegistered() != null) event.setRequireRegistered(request.requireRegistered());
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
     * Anulowanie całego wydarzenia (diagram „Proces anulowania wydarzenia”):
     * status CANCELLED, otwarte zgłoszenia → CANCELED, maile do zawodników (+ wzmianka o zwrocie).
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
                event.getEndDate() != null ? event.getEndDate().toString() : null,
                event.getEndTime(),
                event.getTrack(),
                event.getStreet(),
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
                event.isAcceptRegistrations(),
                event.getSpectatorFee(),
                event.getExternalUrl(),
                event.isRequireDrivingLicense(),
                event.isRequirePzmLicense(),
                event.isRequireOc(),
                event.isRequirePt(),
                event.isRequireCage(),
                event.isRequireRegistered()
        );
    }

    private void applyOptionalEventFields(Event event, String endDate, String endTime, String street,
                                           java.math.BigDecimal spectatorFee, String externalUrl,
                                           Boolean requireDrivingLicense, Boolean requirePzmLicense,
                                           Boolean requireOc, Boolean requirePt,
                                           Boolean requireCage, Boolean requireRegistered) {
        if (endDate != null && !endDate.isBlank()) event.setEndDate(parseDate(endDate));
        if (endTime != null && !endTime.isBlank()) event.setEndTime(endTime);
        if (street != null && !street.isBlank()) event.setStreet(street);
        if (spectatorFee != null) event.setSpectatorFee(spectatorFee);
        if (externalUrl != null && !externalUrl.isBlank()) event.setExternalUrl(externalUrl);
        if (requireDrivingLicense != null) event.setRequireDrivingLicense(requireDrivingLicense);
        if (requirePzmLicense != null) event.setRequirePzmLicense(requirePzmLicense);
        if (requireOc != null) event.setRequireOc(requireOc);
        if (requirePt != null) event.setRequirePt(requirePt);
        if (requireCage != null) event.setRequireCage(requireCage);
        if (requireRegistered != null) event.setRequireRegistered(requireRegistered);
    }

    private LocalDate parseOptionalDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return parseDate(raw);
    }
}
