package pl.raceportal.service;

import pl.raceportal.web.ApiException;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parsuje wyświetlany czas wyścigowy do milisekund.
 * Obsługuje: {@code 83.456}, {@code 1:23.456}, {@code 1:02:03.400}.
 */
public final class RaceTimeParser {

    private static final Pattern H_M_S = Pattern.compile(
            "^(\\d+):([0-5]?\\d):([0-5]?\\d)(?:[.,](\\d{1,3}))?$");
    private static final Pattern M_S = Pattern.compile(
            "^(\\d+):([0-5]?\\d)(?:[.,](\\d{1,3}))?$");
    private static final Pattern S_ONLY = Pattern.compile(
            "^(\\d+)(?:[.,](\\d{1,3}))?$");

    private RaceTimeParser() {
    }

    public static Long parseToMs(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim().replace(',', '.');
        Matcher m = H_M_S.matcher(t);
        if (m.matches()) {
            long h = Long.parseLong(m.group(1));
            long min = Long.parseLong(m.group(2));
            long sec = Long.parseLong(m.group(3));
            return toMs(h * 3600 + min * 60 + sec, m.group(4));
        }
        m = M_S.matcher(t);
        if (m.matches()) {
            long min = Long.parseLong(m.group(1));
            long sec = Long.parseLong(m.group(2));
            return toMs(min * 60 + sec, m.group(3));
        }
        m = S_ONLY.matcher(t);
        if (m.matches()) {
            long sec = Long.parseLong(m.group(1));
            return toMs(sec, m.group(2));
        }
        throw ApiException.badRequest("Nieprawidłowy format czasu (np. 1:23.456)");
    }

    private static long toMs(long wholeSeconds, String frac) {
        int ms = 0;
        if (frac != null && !frac.isEmpty()) {
            String padded = (frac + "000").substring(0, 3);
            ms = Integer.parseInt(padded);
        }
        return wholeSeconds * 1000L + ms;
    }

    public static String normalizeDisplay(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().replace(',', '.').toLowerCase(Locale.ROOT);
    }
}
