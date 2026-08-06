package pl.raceportal.domain;

/**
 * Status wniosku o rolę organizatora ({@link OrganizerApplication}).
 * <p>
 * Rola w architekturze: osobny cykl życia od {@link RegistrationStatus} —
 * dotyczy awansu użytkownika USER → ORGANIZER po decyzji admina.
 * Technologie: JPA enum STRING, Spring Security (zmiana roli po APPROVED).
 * </p>
 * Reguły: nowy wniosek = {@link #PENDING}; admin zatwierdza ({@link #APPROVED}
 * + zmiana {@link Role}) lub odrzuca ({@link #REJECTED}).
 * <p>
 * Pomysł (alt): workflow BPMN / Camunda dla wniosków administracyjnych.
 * </p>
 */
public enum ApplicationStatus {
    /** Wniosek złożony — czeka na decyzję administratora. */
    PENDING,
    /** Zatwierdzony — użytkownik otrzymuje rolę ORGANIZER. */
    APPROVED,
    /** Odrzucony — użytkownik pozostaje przy roli USER. */
    REJECTED
}
