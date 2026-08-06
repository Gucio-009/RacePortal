package pl.raceportal.domain;

import java.util.Locale;

/**
 * Status zgłoszenia zawodnika na wydarzenie (flow dyplomowy „Statusy zgłoszenia”).
 * <p>
 * Rola w architekturze: enum domenowy używany w {@link Registration} oraz logice
 * płatności/zatwierdzania w {@code RegistrationService} / {@code OrganizerService}.
 * Technologie: JPA, Spring Boot (warstwa biznesowa).
 * </p>
 * Przepływ: zgłoszenie startuje jako {@link #PENDING}; organizator przenosi je do
 * {@link #ACCEPTED} (wydarzenia płatne — oczekiwanie na dowód wpłaty) albo od razu
 * do {@link #CONFIRMED} (darmowe / po weryfikacji płatności); {@link #CANCELED}
 * może ustawić kierowca lub organizator.
 * <p>
 * Pomysł (alt): osobna maszyna stanów + outbox eventów domenowych zamiast switchy w serwisie.
 * </p>
 */
public enum RegistrationStatus {
    /** Nowe zgłoszenie — czeka na decyzję organizatora. */
    PENDING,
    /** Zaakceptowane wstępnie (płatne) — zawodnik ma dostarczyć dowód płatności przed deadline. */
    ACCEPTED,
    /** Potwierdzone — miejsce zajęte (darmowe lub po weryfikacji wpłaty). */
    CONFIRMED,
    /** Anulowane przez kierowcę lub organizatora. */
    CANCELED;

    /**
     * Mapuje legacy/aliasy z starszych klientów lub ad-hoc wywołań API
     * (np. {@code APPROVED}, {@code REJECTED}, {@code CANCELLED}) na statusy dyplomowe.
     * {@code APPROVED} jest niejednoznaczne — przy płatnych vs darmowych lepiej
     * przekazywać jawnie {@link #PENDING}/{@link #ACCEPTED}.
     *
     * @param raw surowy status z requestu (może być {@code null})
     * @return zmapowany enum lub {@code null} gdy wejście puste
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
