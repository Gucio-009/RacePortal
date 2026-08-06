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
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.List;
import java.util.Locale;

/**
 * Panel administratora: statystyki, role użytkowników, moderacja wydarzeń i wniosków organizatora.
 * <p>
 * Rola w architekturze: RBAC {@code ROLE_ADMIN} — kontroler wymaga JWT admina.
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

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final OrganizerApplicationRepository organizerApplicationRepository;
    private final EventService eventService;
    private final MailService mailService;

    public AdminService(UserRepository userRepository, EventRepository eventRepository,
                         RegistrationRepository registrationRepository,
                         OrganizerApplicationRepository organizerApplicationRepository,
                         EventService eventService, MailService mailService) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.organizerApplicationRepository = organizerApplicationRepository;
        this.eventService = eventService;
        this.mailService = mailService;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats() {
        long users = userRepository.count();
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

        mailService.send(user.getEmail(), "Zmiana roli w RACEPORTAL",
                "<p>Twoja rola w systemie to teraz: <strong>" + role + "</strong>.</p>");

        return serializeUser(user);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> pendingEvents() {
        return eventRepository.findByStatusOrderByCreatedAtAsc(EventStatus.PENDING).stream()
                .map(eventService::serialize)
                .toList();
    }

    /**
     * Moderacja statusu wydarzenia (APPROVED/REJECTED/…); czyści cache {@code events};
     * powiadamia organizatora mailem.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public EventResponse updateEventStatus(String eventId, EventStatusUpdateRequest request) {
        EventStatus status;
        try {
            status = EventStatus.valueOf(request.status().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Nieprawidłowy status");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));
        event.setStatus(status);
        event = eventRepository.save(event);

        if (event.getOrganizer() != null) {
            mailService.send(event.getOrganizer().getEmail(), "Status wydarzenia: " + event.getName(),
                    "<p>Wydarzenie <strong>" + event.getName() + "</strong> ma teraz status: <strong>" +
                            status + "</strong>.</p>");
        }

        return eventService.serialize(event);
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
        application.setStatus(status);
        application = organizerApplicationRepository.save(application);

        if (status == ApplicationStatus.APPROVED) {
            User user = application.getUser();
            user.setRole(Role.ORGANIZER);
            userRepository.save(user);
        }

        mailService.send(application.getUser().getEmail(), "Wniosek o rolę organizatora",
                "<p>Twój wniosek o konto organizatora: <strong>" + status + "</strong>.</p>");

        return serializeApplication(application);
    }

    private UserAdminResponse serializeUser(User user) {
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getUsername(),
                user.getRole().name(), user.getAvatar(), user.getCreatedAt().toString());
    }

    private OrganizerApplicationResponse serializeApplication(OrganizerApplication application) {
        UserRef userRef = new UserRef(application.getUser().getId(), application.getUser().getUsername(),
                application.getUser().getEmail(), null);
        return new OrganizerApplicationResponse(
                application.getId(),
                application.getUser().getId(),
                application.getCompany(),
                application.getMessage(),
                application.getStatus().name(),
                application.getCreatedAt().toString(),
                application.getUpdatedAt().toString(),
                userRef
        );
    }
}
