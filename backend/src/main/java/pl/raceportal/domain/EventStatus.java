package pl.raceportal.domain;

/**
 * Status cyklu życia wydarzenia wyścigowego.
 * <p>
 * Rola w architekturze: steruje widocznością wydarzeń w API publicznym
 * oraz uprawnieniami organizatora/admina. Technologie: JPA enum STRING, filtracja w serwisach.
 * </p>
 * Reguły biznesowe (przepływ typowy):
 * {@link #DRAFT} → {@link #PENDING} (oczekuje na admina) → {@link #APPROVED}
 * lub {@link #REJECTED}; po zakończeniu daty — {@link #ARCHIVED}; organizator może {@link #CANCELLED}.
 * <p>
 * Pomysł (alt): maszyna stanów (Spring State Machine) zamiast ręcznych przejść w serwisach.
 * </p>
 */
public enum EventStatus {
    /** Szkic lokalny organizatora — niepublikowany, niewidoczny dla zawodników. */
    DRAFT,
    /** Wysłane do moderacji — czeka na decyzję administratora. */
    PENDING,
    /** Zatwierdzone — widoczne publicznie (o ile data/filtrowanie na to pozwala). */
    APPROVED,
    /** Odrzucone przez admina — niepublikowane. */
    REJECTED,
    /** Zarchiwizowane (np. po dacie wydarzenia) — historyczne, bez nowych zgłoszeń. */
    ARCHIVED,
    /** Anulowane przez organizatora/admina — wydarzenie nie odbędzie się. */
    CANCELLED
}
