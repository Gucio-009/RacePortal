package pl.raceportal.dto;

/**
 * DTO powiadomień in-app (lista + licznik nieprzeczytanych).
 */
public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationResponse(
            String id,
            String title,
            String body,
            String type,
            String relatedEventId,
            boolean read,
            String createdAt
    ) {
    }

    public record UnreadCountResponse(long unread) {
    }
}
