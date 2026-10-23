package pl.raceportal.service;

import pl.raceportal.web.ApiException;

import java.net.URI;
import java.util.regex.Pattern;

/**
 * Adres zdjęcia zapisany przy wydarzeniu lub aucie:
 * wgrany plik ({@code /api/uploads/…}) albo link http(s).
 */
public final class ImageReferences {

    private static final Pattern UPLOADED = Pattern.compile(
            "^/api/uploads/[a-f0-9]{32}\\.(jpg|png|webp)$");

    private ImageReferences() {
    }

    /**
     * @param required gdy true, pusty adres jest błędem (tworzenie auta)
     * @return null dla pustego opcjonalnego adresu, inaczej obcięty poprawny URL
     */
    public static String normalize(String raw, boolean required) {
        if (raw == null || raw.isBlank()) {
            if (required) {
                throw ApiException.badRequest("Zdjęcie jest wymagane");
            }
            return null;
        }
        String image = raw.trim();
        if (image.length() > 2000) {
            throw ApiException.badRequest("Adres zdjęcia jest zbyt długi (max 2000 znaków)");
        }
        if (UPLOADED.matcher(image).matches()) {
            return image;
        }
        if (image.startsWith("http://") || image.startsWith("https://")) {
            try {
                URI uri = URI.create(image);
                String scheme = uri.getScheme();
                if (uri.getHost() == null || uri.getHost().isBlank()
                        || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                    throw ApiException.badRequest("Adres zdjęcia musi być poprawnym linkiem http(s)");
                }
            } catch (ApiException ex) {
                throw ex;
            } catch (IllegalArgumentException ex) {
                throw ApiException.badRequest("Adres zdjęcia musi być poprawnym linkiem http(s)");
            }
            return image;
        }
        throw ApiException.badRequest("Wgraj plik JPG, PNG lub WebP albo podaj adres http(s)");
    }
}
