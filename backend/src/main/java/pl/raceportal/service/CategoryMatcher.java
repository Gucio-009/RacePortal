package pl.raceportal.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Matches garage car className to event category (same idea as web carMatch.ts). */
public final class CategoryMatcher {

    private static final Map<String, Set<String>> ALIASES = Map.ofEntries(
            Map.entry("drift", Set.of("drift", "drifting", "drifter", "drift trening", "drift amatorskie", "drift pro")),
            Map.entry("rally", Set.of("rally", "rajd", "rajdy", "rallysprint", "kjs", "superoes", "super sprint",
                    "rsmp", "skjs", "hrsmp")),
            Map.entry("time attack", Set.of("time attack", "timeattack", "ta")),
            Map.entry("track day", Set.of("track day", "trackday", "td")),
            Map.entry("racing", Set.of("racing", "wyscig", "wyścigi", "sprint", "drag race", "wrak race",
                    "rallycross", "wyścigi górskie")),
            Map.entry("gt racing", Set.of("gt racing", "gt", "gt4", "gt3", "cup")),
            Map.entry("endurance", Set.of("endurance", "dlugodystans")),
            Map.entry("mpws", Set.of("mpws"))
    );

    private CategoryMatcher() {
    }

    public static boolean matches(String carClass, String eventCategory) {
        if (carClass == null || carClass.isBlank() || eventCategory == null || eventCategory.isBlank()) {
            return false;
        }
        String carN = normalize(carClass);
        String eventN = normalize(eventCategory);
        if (carN.equals(eventN)) {
            return true;
        }
        String carKey = aliasKey(carN);
        String eventKey = aliasKey(eventN);
        if (carKey != null && carKey.equals(eventKey)) {
            return true;
        }
        return carN.contains(eventN) || eventN.contains(carN);
    }

    private static String aliasKey(String normalized) {
        for (var entry : ALIASES.entrySet()) {
            for (String a : entry.getValue()) {
                String an = normalize(a);
                if (an.equals(normalized) || normalized.contains(an) || an.contains(normalized)) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }

    private static String normalize(String value) {
        String n = Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
        return n;
    }
}
