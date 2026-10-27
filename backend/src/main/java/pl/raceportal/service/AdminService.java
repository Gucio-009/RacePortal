package pl.raceportal.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AdminDtos.EventStatusUpdateRequest;
import pl.raceportal.dto.AdminDtos.OrganizerApplicationResponse;
import pl.raceportal.dto.AdminDtos.RoleUpdateRequest;
import pl.raceportal.dto.AdminDtos.StatsResponse;
import pl.raceportal.dto.AdminDtos.UserAdminResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.RegistrationDtos.UserRef;
import pl.raceportal.repository.BugReportRepository;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.NotificationRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RefreshTokenRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Panel administratora: statystyki, role użytkowników, moderacja wydarzeń i wniosków organizatora.
 * <p>
 * Rola w architekturze: RBAC {@code ROLE_ADMIN} – kontroler wymaga JWT admina.
 * Zmiana statusu wydarzenia invaliduje cache listy; APPROVE wniosku ustawia rolę ORGANIZER.
 * Technologie: Spring Cache, JPA, Spring Mail.
 * </p>
 * Reguły: nie można odebrać sobie roli ADMIN; musi zostać ≥1 admin;
 * wniosek organizatora tylko APPROVED/REJECTED.
 * <p>
 * Pomysł (alt): audit log zmian ról/statusów; Keycloak Admin API zamiast własnego panelu.
 * </p>
 */
@Service
public class AdminService {

    /** Dozwolone przejścia statusu wydarzenia z panelu admina (CANCELLED → cancelEvent). */
    private static final Map<EventStatus, Set<EventStatus>> EVENT_STATUS_TRANSITIONS;

    static {
        EVENT_STATUS_TRANSITIONS = new EnumMap<>(EventStatus.class);
        EVENT_STATUS_TRANSITIONS.put(EventStatus.DRAFT, EnumSet.of(EventStatus.PENDING, EventStatus.CANCELLED));
        EVENT_STATUS_TRANSITIONS.put(EventStatus.PENDING,
                EnumSet.of(EventStatus.APPROVED, EventStatus.REJECTED, EventStatus.CANCELLED));
        EVENT_STATUS_TRANSITIONS.put(EventStatus.APPROVED,
                EnumSet.of(EventStatus.CANCELLED, EventStatus.ARCHIVED));
        EVENT_STATUS_TRANSITIONS.put(EventStatus.REJECTED,
                EnumSet.of(EventStatus.PENDING, EventStatus.CANCELLED));
        EVENT_STATUS_TRANSITIONS.put(EventStatus.ARCHIVED, EnumSet.noneOf(EventStatus.class));
        EVENT_STATUS_TRANSITIONS.put(EventStatus.CANCELLED, EnumSet.noneOf(EventStatus.class));
    }

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final OrganizerApplicationRepository organizerApplicationRepository;
    private final CarRepository carRepository;
    private final NotificationRepository notificationRepository;
    private final BugReportRepository bugReportRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EventService eventService;
    private final MailService mailService;
    private final NotificationService notificationService;
    private final StatsService statsService;

    public AdminService(UserRepository userRepository, EventRepository eventRepository,
                         RegistrationRepository registrationRepository,
                         OrganizerApplicationRepository organizerApplicationRepository,
                         CarRepository carRepository,
                         NotificationRepository notificationRepository,
                         BugReportRepository bugReportRepository,
                         RefreshTokenRepository refreshTokenRepository,
                         EventService eventService, MailService mailService,
                         NotificationService notificationService,
                         StatsService statsService) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.organizerApplicationRepository = organizerApplicationRepository;
        this.carRepository = carRepository;
        this.notificationRepository = notificationRepository;
        this.bugReportRepository = bugReportRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.eventService = eventService;
        this.mailService = mailService;
        this.notificationService = notificationService;
        this.statsService = statsService;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats() {
        long users = statsService.countRegisteredUsers();
        long events = eventRepository.count();
        long pendingEvents = eventRepository.findByStatusOrderByCreatedAtAsc(EventStatus.PENDING).size();
        long registrations = registrationRepository.count();
        long pendingApps = organizerApplicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING)
                .count();
        return new StatsResponse(users, events, pendingEvents, registrations, pendingApps);
    }

    @Transactional(readOnly = true)
    public List<UserAdminResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(200)
                .map(this::serializeUser)
                .toList();
    }

    /**
     * Zmiana roli użytkownika z zabezpieczeniami przed usunięciem ostatniego admina
     * oraz self-demotion. Wysyła mail z nową rolą.
     */
    @Transactional
    public UserAdminResponse updateUserRole(String userId, RoleUpdateRequest request, UserPrincipal currentUser) {
        Role role;
        try {
            role = Role.valueOf(request.role().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Nieprawidłowa rola");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        if (currentUser != null && currentUser.getId().equals(userId) && user.getRole() == Role.ADMIN && role != Role.ADMIN) {
            throw ApiException.badRequest("Nie możesz odebrać sobie roli administratora");
        }

        if (user.getRole() == Role.ADMIN && role != Role.ADMIN) {
            long adminCount = userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).count();
            if (adminCount <= 1) {
                throw ApiException.badRequest("Musi pozostać co najmniej jeden administrator");
            }
        }

        user.setRole(role);
        user = userRepository.save(user);

        String locale = pl.raceportal.i18n.MailTexts.of(user);
        mailService.send(user.getEmail(),
                pl.raceportal.i18n.MailTexts.roleChangedSubject(locale),
                pl.raceportal.i18n.MailTexts.roleChangedBody(locale, role.name()),
                locale);

        return serializeUser(user);
    }

    /**
     * Kasuje konto. Nie można usunąć siebie ani ostatniego administratora.
     * Wydarzenia organizowane przez to konto przechodzą na administratora, który kasuje.
     * Zgłoszenia, auta, powiadomienia i wnioski tego konta są usuwane.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public void deleteUser(String userId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw ApiException.unauthorized("Wymagane logowanie");
        }
        if (currentUser.getId().equals(userId)) {
            throw ApiException.badRequest("Nie możesz usunąć własnego konta");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).count();
            if (adminCount <= 1) {
                throw ApiException.badRequest("Musi pozostać co najmniej jeden administrator");
            }
        }

        User actingAdmin = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> ApiException.unauthorized("Wymagane logowanie"));
        List<Event> organized = eventRepository.findByOrganizer_IdOrderByDateDesc(userId);
        for (Event event : organized) {
            event.setOrganizer(actingAdmin);
        }
        eventRepository.saveAll(organized);
        eventRepository.flush();

        registrationRepository.deleteByCar_User_Id(userId);
        registrationRepository.deleteByUser_Id(userId);
        notificationRepository.deleteByUser_Id(userId);
        organizerApplicationRepository.deleteByUser_Id(userId);
        bugReportRepository.detachUser(userId);
        carRepository.deleteByUser_Id(userId);
        refreshTokenRepository.deleteByUser_Id(userId);
        userRepository.deleteById(userId);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> pendingEvents() {
        return eventService.serializeAll(eventRepository.findByStatusOrderByCreatedAtAsc(EventStatus.PENDING));
    }

    /** Ostatnie zatwierdzone wydarzenia – do anulowania z panelu admina. */
    @Transactional(readOnly = true)
    public List<EventResponse> approvedEvents() {
        return eventService.serializeAll(
                eventRepository.findTop50ByStatusOrderByUpdatedAtDesc(EventStatus.APPROVED));
    }

    /**
     * Moderacja statusu wydarzenia (APPROVED/REJECTED/…); czyści cache {@code events};
     * powiadamia organizatora mailem. CANCELLED → pełna anulacja ze zgłoszeniami.
     * Przejścia ograniczone FSM – brak „wskrzeszania” CANCELLED.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public EventResponse updateEventStatus(String eventId, EventStatusUpdateRequest request,
                                            UserPrincipal currentUser) {
        EventStatus target;
        try {
            target = EventStatus.valueOf(request.status().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Nieprawidłowy status");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));
        EventStatus current = event.getStatus();
        if (current == target) {
            return eventService.serialize(event);
        }
        Set<EventStatus> allowed = EVENT_STATUS_TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(target)) {
            throw ApiException.badRequest(
                    "Niedozwolone przejście statusu: " + current + " → " + target);
        }

        if (target == EventStatus.CANCELLED) {
            return eventService.cancelEvent(eventId, currentUser);
        }

        String reason = request.reason() == null ? "" : request.reason().trim();
        if (target == EventStatus.REJECTED) {
            if (reason.isBlank()) {
                throw ApiException.badRequest("Przy odrzuceniu wydarzenia podaj powód");
            }
            if (reason.length() > 2000) {
                throw ApiException.badRequest("Powód odrzucenia jest zbyt długi (max 2000 znaków)");
            }
            event.setRejectionReason(reason);
        } else if (target == EventStatus.APPROVED) {
            event.setRejectionReason(null);
        }

        event.setStatus(target);
        event = eventRepository.save(event);

        if (target == EventStatus.PENDING) {
            notificationService.notifyAdminsPendingEvent(event);
        } else {
            notifyOrganizerAboutEventStatus(event, target, reason);
        }

        return eventService.serialize(event);
    }

    /** E-mail + powiadomienie in-app dla organizatora po decyzji admina. */
    private void notifyOrganizerAboutEventStatus(Event event, EventStatus target, String reason) {
        User organizer = event.getOrganizer();
        if (organizer == null) {
            return;
        }

        String eventName = event.getName() == null ? "wydarzenie" : event.getName();
        String safeName = escapeHtml(eventName);
        String safeReason = escapeHtml(reason);

        String locale = pl.raceportal.i18n.MailTexts.of(organizer);
        if (target == EventStatus.APPROVED) {
            String title = "Wydarzenie zaakceptowane";
            String body = "Twoje wydarzenie \"" + eventName + "\" zostało zaakceptowane i jest widoczne publicznie.";
            notificationService.notifyUser(organizer, "EVENT_APPROVED", title, body, event.getId());
            mailService.send(organizer.getEmail(),
                    pl.raceportal.i18n.MailTexts.eventApprovedSubject(locale, eventName),
                    pl.raceportal.i18n.MailTexts.eventApprovedBody(locale, safeName),
                    locale);
            return;
        }

        if (target == EventStatus.REJECTED) {
            String title = "Wydarzenie odrzucone";
            String body = "Twoje wydarzenie \"" + eventName + "\" zostało odrzucone. Powód: " + reason;
            notificationService.notifyUser(organizer, "EVENT_REJECTED", title, body, event.getId());
            mailService.send(organizer.getEmail(),
                    pl.raceportal.i18n.MailTexts.eventRejectedSubject(locale, eventName),
                    pl.raceportal.i18n.MailTexts.eventRejectedBody(locale, safeName, safeReason),
                    locale);
            return;
        }

        String title = "Status wydarzenia: " + target.name();
        String body = "Wydarzenie \"" + eventName + "\" ma teraz status: " + target.name() + ".";
        notificationService.notifyUser(organizer, "EVENT_STATUS", title, body, event.getId());
        mailService.send(organizer.getEmail(),
                pl.raceportal.i18n.MailTexts.eventStatusSubject(locale, eventName),
                pl.raceportal.i18n.MailTexts.eventStatusBody(locale, safeName, escapeHtml(target.name())),
                locale);
    }

    private static String escapeHtml(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    @Transactional(readOnly = true)
    public List<OrganizerApplicationResponse> organizerApplications() {
        return organizerApplicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::serializeApplication)
                .toList();
    }

    /**
     * Decyzja o wniosku organizatora: APPROVED → {@link Role#ORGANIZER}; REJECTED bez zmiany roli.
     */
    @Transactional
    public OrganizerApplicationResponse updateOrganizerApplicationStatus(String appId, String statusValue) {
        ApplicationStatus status;
        try {
            status = ApplicationStatus.valueOf(statusValue.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Nieprawidłowy status");
        }
        if (status != ApplicationStatus.APPROVED && status != ApplicationStatus.REJECTED) {
            throw ApiException.badRequest("Nieprawidłowy status");
        }

        OrganizerApplication application = organizerApplicationRepository.findById(appId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw ApiException.badRequest("Wniosek został już rozpatrzony");
        }
        application.setStatus(status);
        application = organizerApplicationRepository.save(application);

        if (status == ApplicationStatus.APPROVED) {
            User user = application.getUser();
            // Nie degraduj ADMIN → ORGANIZER; USER/ORGANIZER → ORGANIZER.
            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ORGANIZER);
                userRepository.save(user);
            }
        }

        User applicant = application.getUser();
        String locale = pl.raceportal.i18n.MailTexts.of(applicant);
        mailService.send(applicant.getEmail(),
                pl.raceportal.i18n.MailTexts.organizerAppSubject(locale),
                pl.raceportal.i18n.MailTexts.organizerAppBody(locale, status.name()),
                locale);

        return serializeApplication(application);
    }

    private UserAdminResponse serializeUser(User user) {
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getUsername(),
                user.getRole().name(), user.getAvatar(), user.getCreatedAt().toString());
    }

    private OrganizerApplicationResponse serializeApplication(OrganizerApplication application) {
        UserRef userRef = UserRef.from(application.getUser());
        return new OrganizerApplicationResponse(
                application.getId(),
                application.getUser().getId(),
                application.getCompany(),
                application.getBusinessType(),
                application.getMessage(),
                application.getStatus().name(),
                application.getCreatedAt().toString(),
                application.getUpdatedAt().toString(),
                userRef
        );
    }
}
