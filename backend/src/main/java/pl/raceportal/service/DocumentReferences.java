package pl.raceportal.service;

import pl.raceportal.web.ApiException;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Załączniki PDF wydarzenia: lokalny upload {@code /api/uploads/….pdf} albo http(s).
 */
public final class DocumentReferences {

    private static final Pattern UPLOADED_PDF = Pattern.compile(
            "^/api/uploads/[a-f0-9]{32}\\.pdf$");

    private DocumentReferences() {
    }

    public static List<String> parse(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String part : csv.split(",")) {
            String value = part.trim();
            if (!value.isEmpty()) {
                out.add(value);
            }
        }
        return List.copyOf(out);
    }

    /** Waliduje listę URL i zwraca CSV albo {@code null} gdy pusto. */
    public static String normalizeCsv(String csv, String fieldLabel) {
        List<String> parts = parse(csv);
        if (parts.isEmpty()) {
            return null;
        }
        List<String> ok = new ArrayList<>(parts.size());
        for (String raw : parts) {
            ok.add(normalizeOne(raw, fieldLabel));
        }
        return String.join(", ", ok);
    }

    private static String normalizeOne(String raw, String fieldLabel) {
        String value = raw.trim();
        if (value.length() > 2000) {
            throw ApiException.badRequest(fieldLabel + ": adres jest zbyt długi (max 2000 znaków)");
        }
        if (UPLOADED_PDF.matcher(value).matches()) {
            return value;
        }
        String lower = value.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw ApiException.badRequest(fieldLabel + ": wgraj PDF albo podaj adres http(s)");
        }
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || uri.getHost().isBlank()
                    || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw ApiException.badRequest(fieldLabel + ": wgraj PDF albo podaj adres http(s)");
            }
        } catch (ApiException ex) {
            throw ex;
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest(fieldLabel + ": wgraj PDF albo podaj adres http(s)");
        }
        return value;
    }
}
