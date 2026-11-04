package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.OrganizerCommsDtos.BroadcastRequest;
import pl.raceportal.dto.OrganizerCommsDtos.BroadcastResult;
import pl.raceportal.i18n.MailTexts;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class OrganizerCommsService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;
    private final MailService mailService;

    public OrganizerCommsService(EventRepository eventRepository,
                                  RegistrationRepository registrationRepository,
                                  NotificationService notificationService,
                                  MailService mailService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.notificationService = notificationService;
        this.mailService = mailService;
    }

    @Transactional
    public BroadcastResult broadcast(String eventId, BroadcastRequest request, UserPrincipal currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wydarzenia"));
        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }
        if (!request.sendEmail() && !request.sendInApp()) {
            throw ApiException.badRequest("Wybierz e-mail i/lub powiadomienie systemowe");
        }

        Set<RegistrationStatus> statuses = parseStatuses(request.statuses());
        String classId = request.classId() != null && !request.classId().isBlank() ? request.classId().trim() : null;

        List<Registration> targets = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(eventId).stream()
                .filter(r -> statuses.contains(r.getStatus()))
                .filter(r -> classId == null
                        || (r.getAssignedClass() != null && classId.equals(r.getAssignedClass().getId())))
                .toList();

        String subject = request.subject().trim();
        String body = request.body().trim();
        String eventName = event.getName() == null ? "" : event.getName();
        String safeBody = escapeHtml(body).replace("\n", "<br/>");

        int emailed = 0;
        int notified = 0;
        Set<String> seenUsers = new HashSet<>();
        for (Registration reg : targets) {
            User user = reg.getUser();
            if (user == null || !seenUsers.add(user.getId())) {
                continue;
            }
            if (request.sendInApp()) {
                notificationService.notifyUser(user, "ORGANIZER_BROADCAST", subject, body, eventId);
                notified++;
            }
            if (request.sendEmail() && user.getEmail() != null && !user.getEmail().isBlank()) {
                String locale = MailTexts.of(user);
                String html = "<p>Wiadomość od organizatora wydarzenia <strong>"
                        + escapeHtml(eventName) + "</strong>:</p><p>" + safeBody + "</p>";
                mailService.send(user.getEmail(), subject, html, locale);
                emailed++;
            }
        }
        return new BroadcastResult(seenUsers.size(), emailed, notified);
    }

    private static Set<RegistrationStatus> parseStatuses(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return Set.of(
                    RegistrationStatus.PENDING,
                    RegistrationStatus.ACCEPTED,
                    RegistrationStatus.CONFIRMED
            );
        }
        Set<RegistrationStatus> out = new HashSet<>();
        for (String s : raw) {
            if (s == null || s.isBlank()) {
                continue;
            }
            try {
                out.add(RegistrationStatus.valueOf(s.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw ApiException.badRequest("Nieprawidłowy status: " + s);
            }
        }
        if (out.isEmpty()) {
            throw ApiException.badRequest("Wybierz przynajmniej jeden status");
        }
        return out;
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
}
