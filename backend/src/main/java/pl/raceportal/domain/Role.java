package pl.raceportal.domain;

/**
 * Role użytkownika w systemie RacePortal — podstawa RBAC (Spring Security authorities).
 * <p>
 * Rola w architekturze: enum domenowy mapowany na {@code ROLE_*} w JWT i filtrach bezpieczeństwa.
 * Technologie: JPA ({@code @Enumerated(STRING)}), Spring Security.
 * </p>
 * Reguły biznesowe: każdy nowy użytkownik startuje jako {@link #USER};
 * awans do {@link #ORGANIZER} wymaga zatwierdzenia wniosku przez admina;
 * {@link #ADMIN} jest kontem systemowym / seedowanym.
 * <p>
 * Pomysł (alt): Keycloak / Auth0 z mapowaniem ról z realm roles zamiast enum w DB.
 * </p>
 */
public enum Role {
    /** Zwykły kierowca/zawodnik — garaż, zgłoszenia na wydarzenia, profil. */
    USER,
    /** Organizator — tworzy i zarządza wydarzeniami oraz zatwierdza zgłoszenia. */
    ORGANIZER,
    /** Administrator — moderacja wydarzeń, wniosków o rolę organizatora, użytkowników. */
    ADMIN
}
