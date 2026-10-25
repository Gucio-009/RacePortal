package pl.raceportal.security;

import java.util.Locale;
import java.util.Set;

/**
 * Nazwy wyświetlane zablokowane przy rejestracji / zmianie profilu (pentest #6).
 * <p>
 * Seed może nadal tworzyć konta {@code Administrator} / {@code Organizator}
 * poza tą ścieżką — nowi użytkownicy nie mogą ich sklonować ani zająć samych słów wrażliwych.
 * </p>
 */
public final class ReservedUsernames {

    private static final Set<String> RESERVED = Set.of(
            "admin",
            "administrator",
            "administratorzy",
            "organizator",
            "organizer",
            "organisator",
            "raceportal",
            "race-portal",
            "race_portal",
            "support",
            "pomoc",
            "moderacja",
            "moderator",
            "system",
            "root",
            "staff",
            "official",
            "oficjalny",
            "noreply",
            "mail",
            "kontakt",
            "contact"
    );

    private ReservedUsernames() {
    }

    /** Porównanie bez wielkości liter i bez białych znaków wewnątrz nazwy. */
    public static boolean isReserved(String username) {
        if (username == null || username.isBlank()) {
            return false;
        }
        return RESERVED.contains(normalize(username));
    }

    public static String normalize(String username) {
        return username.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }
}
