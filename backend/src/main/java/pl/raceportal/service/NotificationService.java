package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Notification;
import pl.raceportal.domain.User;
import pl.raceportal.dto.NotificationDtos.NotificationResponse;
import pl.raceportal.dto.NotificationDtos.UnreadCountResponse;
import pl.raceportal.repository.NotificationRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.List;

/**
 * Powiadomienia in-app: tworzenie (z serwisów domenowych) oraz odczyt/oznaczanie dla użytkownika.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
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
