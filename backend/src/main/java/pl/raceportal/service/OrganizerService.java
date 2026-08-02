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

    @Transactional(readOnly = true)
    public List<EventResponse> events(UserPrincipal currentUser) {
        var events = currentUser.getRole() == Role.ADMIN
                ? eventRepository.findAllByOrderByDateDesc()
                : eventRepository.findByOrganizer_IdOrderByDateDesc(currentUser.getId());
        return events.stream().map(eventService::serialize).toList();
    }
}
