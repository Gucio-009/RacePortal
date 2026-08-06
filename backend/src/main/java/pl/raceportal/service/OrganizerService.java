package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AdminDtos.OrganizerApplicationResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.OrganizerDtos.ApplyRequest;
import pl.raceportal.dto.RegistrationDtos.UserRef;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.List;

/**
 * Operacje z perspektywy organizatora: wniosek o rolę oraz lista własnych wydarzeń.
 * <p>
 * Rola w architekturze: most między użytkownikiem USER a panelem organizatora.
 * Zatwierdzanie wniosków leży w {@code AdminService}. Technologie: Spring, JPA, transakcje.
 * </p>
 * Reguły: ORGANIZER/ADMIN nie składa wniosku ponownie; maksymalnie jeden PENDING wniosek;
 * admin widzi wszystkie wydarzenia, organizator — tylko swoje.
 * <p>
 * Pomysł (alt): CQRS — osobne read-modele dla listy wydarzeń organizatora.
 * </p>
 */
@Service
public class OrganizerService {

    private final OrganizerApplicationRepository organizerApplicationRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;

    public OrganizerService(OrganizerApplicationRepository organizerApplicationRepository,
                             UserRepository userRepository, EventRepository eventRepository,
                             EventService eventService) {
        this.organizerApplicationRepository = organizerApplicationRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.eventService = eventService;
    }

    /**
     * Składa wniosek o rolę ORGANIZER (status PENDING) — wymaga zalogowanego USER.
     */
    @Transactional
    public OrganizerApplicationResponse apply(UserPrincipal currentUser, ApplyRequest request) {
        if (currentUser.getRole() == Role.ORGANIZER || currentUser.getRole() == Role.ADMIN) {
            throw ApiException.badRequest("Masz już uprawnienia organizatora");
        }

        organizerApplicationRepository.findFirstByUser_IdAndStatus(currentUser.getId(), ApplicationStatus.PENDING)
                .ifPresent(a -> {
                    throw ApiException.conflict("Masz już aktywny wniosek");
                });

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        OrganizerApplication application = new OrganizerApplication();
        application.setUser(user);
        application.setCompany(request.company());
        application.setMessage(request.message());
        application.setStatus(ApplicationStatus.PENDING);
        application = organizerApplicationRepository.save(application);

        UserRef userRef = new UserRef(user.getId(), user.getUsername(), user.getEmail(), null);
        return new OrganizerApplicationResponse(
                application.getId(), user.getId(), application.getCompany(), application.getMessage(),
                application.getStatus().name(), application.getCreatedAt().toString(),
                application.getUpdatedAt().toString(), userRef);
    }

    /**
     * Lista wydarzeń: ADMIN = wszystkie; ORGANIZER = tylko {@code organizer_id = ja}.
     */
    @Transactional(readOnly = true)
    public List<EventResponse> events(UserPrincipal currentUser) {
        var events = currentUser.getRole() == Role.ADMIN
                ? eventRepository.findAllByOrderByDateDesc()
                : eventRepository.findByOrganizer_IdOrderByDateDesc(currentUser.getId());
        return events.stream().map(eventService::serialize).toList();
    }
}
