package pl.raceportal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
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

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

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
        String contentType = sniffedType(file);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Dozwolone formaty: JPG, PNG, WebP");
        }

        String ext = EXT_BY_TYPE.get(contentType);
        return storeFile(file, contentType, ext);
    }

    public UploadResponse storePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Brak pliku");
        }
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("Plik za duży (max " + (maxBytes / (1024 * 1024)) + " MB)");
        }
        if (!isPdf(file)) {
            throw ApiException.badRequest("Dozwolony format: PDF");
        }
        return storeFile(file, MediaType.APPLICATION_PDF_VALUE, ".pdf");
    }

    private UploadResponse storeFile(MultipartFile file, String contentType, String ext) {
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir)) {
            throw ApiException.badRequest("Nieprawidłowa ścieżka");
        }

        try {
            Files.createDirectories(uploadDir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Nie udało się zapisać uploadu do {}", target, e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się zapisać pliku");
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
        if (lower.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }

    /** Typ z sygnatury pliku, nie z nagłówka przeglądarki (często pusty albo octet-stream). */
    private static String sniffedType(MultipartFile file) {
        byte[] head = readHead(file, 16);
        int read = head.length;
        if (read >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (read >= 8
                && (head[0] & 0xFF) == 0x89
                && head[1] == 0x50
                && head[2] == 0x4E
                && head[3] == 0x47
                && head[4] == 0x0D
                && head[5] == 0x0A
                && head[6] == 0x1A
                && head[7] == 0x0A) {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (read >= 12
                && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
            return "image/webp";
        }
        return "";
    }

    private static boolean isPdf(MultipartFile file) {
        byte[] head = readHead(file, 5);
        return head.length >= 4
                && head[0] == '%'
                && head[1] == 'P'
                && head[2] == 'D'
                && head[3] == 'F';
    }

    private static byte[] readHead(MultipartFile file, int max) {
        byte[] head = new byte[max];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.read(head);
        } catch (IOException e) {
            throw ApiException.badRequest("Nie udało się odczytać pliku");
        }
        if (read <= 0) {
            return new byte[0];
        }
        if (read == head.length) {
            return head;
        }
        byte[] trimmed = new byte[read];
        System.arraycopy(head, 0, trimmed, 0, read);
        return trimmed;
    }

    private static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw ApiException.badRequest("Brak nazwy pliku");
        }
        String base = Path.of(filename).getFileName().toString();
        if (!base.matches("[a-f0-9]{32}\\.(jpg|png|webp|pdf)")) {
            throw ApiException.badRequest("Nieprawidłowa nazwa pliku");
        }
        return base;
    }
}
