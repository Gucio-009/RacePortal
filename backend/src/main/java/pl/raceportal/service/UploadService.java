package pl.raceportal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pl.raceportal.dto.UploadDtos.UploadResponse;
import pl.raceportal.web.ApiException;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Lokalny upload obrazów (garaż / plakat / potwierdzenie przelewu).
 * Limit rozmiaru i whitelist MIME — bez zewnętrznego S3 na MVP.
 */
@Service
public class UploadService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp"
    );

    private static final Map<String, String> EXT_BY_TYPE = Map.of(
            MediaType.IMAGE_JPEG_VALUE, ".jpg",
            MediaType.IMAGE_PNG_VALUE, ".png",
            "image/webp", ".webp"
    );

    private final Path uploadDir;
    private final long maxBytes;

    public UploadService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.max-bytes:5242880}") long maxBytes) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        this.maxBytes = maxBytes;
    }

    @PostConstruct
    void ensureDir() throws IOException {
        Files.createDirectories(uploadDir);
    }

    public UploadResponse storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Brak pliku");
        }
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("Plik za duży (max " + (maxBytes / (1024 * 1024)) + " MB)");
        }
        String contentType = normalizeType(file.getContentType());
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Dozwolone formaty: JPG, PNG, WebP");
        }

        String ext = EXT_BY_TYPE.get(contentType);
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir)) {
            throw ApiException.badRequest("Nieprawidłowa ścieżka");
        }

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw ApiException.badRequest("Nie udało się zapisać pliku");
        }

        return new UploadResponse("/api/uploads/" + filename, contentType, file.getSize());
    }

    public Resource loadAsResource(String filename) {
        String safe = sanitizeFilename(filename);
        try {
            Path file = uploadDir.resolve(safe).normalize();
            if (!file.startsWith(uploadDir) || !Files.isRegularFile(file)) {
                throw ApiException.notFound("Nie znaleziono pliku");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw ApiException.notFound("Nie znaleziono pliku");
            }
            return resource;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.notFound("Nie znaleziono pliku");
        }
    }

    public MediaType mediaTypeFor(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }

    private static String normalizeType(String contentType) {
        if (contentType == null) {
            return "";
        }
        String t = contentType.trim().toLowerCase(Locale.ROOT);
        int semi = t.indexOf(';');
        return semi >= 0 ? t.substring(0, semi).trim() : t;
    }

    private static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw ApiException.badRequest("Brak nazwy pliku");
        }
        String base = Path.of(filename).getFileName().toString();
        if (!base.matches("[a-f0-9]{32}\\.(jpg|png|webp)")) {
            throw ApiException.badRequest("Nieprawidłowa nazwa pliku");
        }
        return base;
    }
}
