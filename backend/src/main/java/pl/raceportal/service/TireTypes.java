package pl.raceportal.service;

import pl.raceportal.web.ApiException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Kanoniczne klucze rodzajów opon (garaż + ograniczenia wydarzenia).
 */
public final class TireTypes {

    public static final Set<String> ALLOWED = Set.of(
            "road", "semislick", "slick", "gravel", "rain", "studded"
    );

    private TireTypes() {
    }

    public static List<String> parse(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String part : csv.split(",")) {
            String key = part.trim().toLowerCase(Locale.ROOT);
            if (!key.isEmpty()) {
                out.add(key);
            }
        }
        return List.copyOf(out);
    }

    /** Waliduje klucze i zwraca CSV albo {@code null} gdy pusto. */
    public static String normalizeCsv(String csv, String fieldLabel) {
        List<String> parts = parse(csv);
        if (parts.isEmpty()) {
            return null;
        }
        List<String> ok = new ArrayList<>(parts.size());
        for (String key : parts) {
            if (!ALLOWED.contains(key)) {
                throw ApiException.badRequest(fieldLabel + ": nieznany rodzaj opon „" + key + "”");
            }
            ok.add(key);
        }
        return String.join(", ", ok);
    }
}
