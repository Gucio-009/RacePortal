package pl.raceportal.service;

import pl.raceportal.web.ApiException;

import java.net.URI;
import java.util.regex.Pattern;

/**
 * Walidacja URL przy zapisie (pentest stored XSS / javascript:).
 * Dozwolone wyłącznie {@code http://} / {@code https://} z hostem;
 * opcjonalnie ścieżka uploadu {@code /api/uploads/…} (dowód przelewu / zdjęcia).
 */
public final class SafeHttpUrls {

    private static final Pattern UPLOADED = Pattern.compile(
            "^/api/uploads/[a-f0-9]{32}\\.(jpg|png|webp)$");

    private static final String HTTP_URL_MESSAGE = "Dozwolone tylko adresy http:// lub https://";

    private SafeHttpUrls() {
    }

    /**
     * Opcjonalny link zewnętrzny (externalUrl, social, video).
     *
     * @return {@code null} gdy puste; inaczej przycięty http(s) URL
     */
    public static String normalizeHttpUrl(String raw, String fieldLabel) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        if (value.length() > 2000) {
            throw ApiException.badRequest(fieldLabel + ": adres jest zbyt długi (max 2000 znaków)");
        }
        return requireAbsoluteHttp(value, fieldLabel);
    }

    /**
     * Dowód przelewu: upload lokalny albo http(s).
     */
    public static String normalizeHttpUrlOrUpload(String raw, String fieldLabel) {
        if (raw == null || raw.isBlank()) {
            throw ApiException.badRequest(fieldLabel + " jest wymagany");
        }
        String value = raw.trim();
        if (value.length() > 2000) {
            throw ApiException.badRequest(fieldLabel + ": adres jest zbyt długi (max 2000 znaków)");
        }
        if (UPLOADED.matcher(value).matches()) {
            return value;
        }
        return requireAbsoluteHttp(value, fieldLabel);
    }

    private static String requireAbsoluteHttp(String value, String fieldLabel) {
        String lower = value.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw ApiException.badRequest(fieldLabel + ": " + HTTP_URL_MESSAGE);
        }
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || uri.getHost().isBlank()
                    || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw ApiException.badRequest(fieldLabel + ": " + HTTP_URL_MESSAGE);
            }
        } catch (ApiException ex) {
            throw ex;
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest(fieldLabel + ": " + HTTP_URL_MESSAGE);
        }
        return value;
    }
}
