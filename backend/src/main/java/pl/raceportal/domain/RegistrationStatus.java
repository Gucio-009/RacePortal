package pl.raceportal.domain;

import java.util.Locale;

/**
 * Statuses follow the diploma "Statusy zgłoszenia" flow: a registration starts
 * PENDING, then moves to ACCEPTED (paid events awaiting proof of payment) or
 * straight to CONFIRMED (free events / paid events once payment is verified),
 * and can be CANCELED by either the driver or the organizer at any point.
 */
public enum RegistrationStatus {
    PENDING,
    ACCEPTED,
    CONFIRMED,
    CANCELED;

    /**
     * Resolves legacy/alias values used by older clients or ad-hoc API calls
     * (e.g. "APPROVED", "REJECTED", "CANCELLED") to the diploma statuses above.
     * "APPROVED" is ambiguous on its own, so callers that need paid-vs-free
     * smart resolution should prefer {@link #PENDING}/{@link #ACCEPTED} explicitly.
     */
    public static RegistrationStatus parse(String raw) {
        if (raw == null) {
            return null;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "APPROVED" -> ACCEPTED;
            case "REJECTED", "CANCELLED" -> CANCELED;
            default -> RegistrationStatus.valueOf(normalized);
        };
    }
}
