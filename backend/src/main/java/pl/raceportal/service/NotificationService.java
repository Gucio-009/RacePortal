package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.Notification;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.NotificationDtos.NotificationResponse;
import pl.raceportal.dto.NotificationDtos.UnreadCountResponse;
import pl.raceportal.repository.NotificationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.List;

/**
 * Powiadomienia in-app: tworzenie (z serwisów domenowych) oraz odczyt/oznaczanie dla użytkownika.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    public NotificationService(NotificationRepository notificationRepository,
                                UserRepository userRepository, MailService mailService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    @Transactional
    public void notifyUser(User user, String type, String title, String body, String relatedEventId) {
        if (user == null) {
            return;
        }
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setRelatedEventId(relatedEventId);
        notificationRepository.save(n);
    }

    /**
     * Informuje wszystkich adminów (in-app + e-mail), że wydarzenie czeka na moderację.
     */
    @Transactional
    public void notifyAdminsPendingEvent(Event event) {
        if (event == null || event.getId() == null) {
            return;
        }
        String eventName = event.getName() == null ? "wydarzenie" : event.getName();
        String organizerName = event.getOrganizer() != null ? event.getOrganizer().getUsername() : "organizator";
        String title = "Nowe wydarzenie do akceptacji";
        String body = "\"" + eventName + "\" od " + organizerName + " czeka na decyzję w panelu admina.";
        String safeName = escapeHtml(eventName);
        String safeOrg = escapeHtml(organizerName);

        for (User admin : userRepository.findByRole(Role.ADMIN)) {
            notifyUser(admin, "EVENT_PENDING_REVIEW", title, body, event.getId());
            mailService.send(admin.getEmail(), "RACEPORTAL: wydarzenie do akceptacji – " + eventName,
                    "<p>Nowe wydarzenie oczekuje na moderację.</p>"
                            + "<p><strong>" + safeName + "</strong> (organizator: " + safeOrg + ")</p>"
                            + "<p>Otwórz panel admina i zaakceptuj lub odrzuć wniosek.</p>");
        }
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
    public List<NotificationResponse> listMine(UserPrincipal currentUser) {
        return notificationRepository.findTop50ByUser_IdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::serialize)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(UserPrincipal currentUser) {
        return new UnreadCountResponse(notificationRepository.countByUser_IdAndReadFalse(currentUser.getId()));
    }

    @Transactional
    public NotificationResponse markRead(String id, UserPrincipal currentUser) {
        Notification n = notificationRepository.findByIdAndUser_Id(id, currentUser.getId())
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono powiadomienia"));
        n.setRead(true);
        return serialize(notificationRepository.save(n));
    }

    @Transactional
    public UnreadCountResponse markAllRead(UserPrincipal currentUser) {
        List<Notification> unread = notificationRepository.findByUser_IdAndReadFalse(currentUser.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        return new UnreadCountResponse(0);
    }

    @Transactional
    public void delete(String id, UserPrincipal currentUser) {
        Notification n = notificationRepository.findByIdAndUser_Id(id, currentUser.getId())
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono powiadomienia"));
        notificationRepository.delete(n);
    }

    private NotificationResponse serialize(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getType(),
                n.getRelatedEventId(),
                n.isRead(),
                n.getCreatedAt().toString()
        );
    }
}
