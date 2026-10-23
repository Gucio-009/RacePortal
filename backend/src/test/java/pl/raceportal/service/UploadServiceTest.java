package pl.raceportal.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import pl.raceportal.dto.UploadDtos.UploadResponse;
import pl.raceportal.web.ApiException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UploadServiceTest {

    private static final byte[] JPEG = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xD9};
    private static final byte[] PNG = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00
    };
    private static final byte[] WEBP = new byte[] {
            'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'
    };

    @TempDir
    Path dir;

    private UploadService uploads;

    @BeforeEach
    void setUp() throws Exception {
        uploads = new UploadService(dir.toString(), 32);
        uploads.ensureDir();
    }

    @Test
    void storesJpegEvenWhenBrowserSendsOctetStream() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "auto.jpg", "application/octet-stream", JPEG);

        UploadResponse saved = uploads.storeImage(file);

        assertTrue(saved.url().matches("/api/uploads/[a-f0-9]{32}\\.jpg"));
        String name = saved.url().substring("/api/uploads/".length());
        assertArrayEquals(JPEG, uploads.loadAsResource(name).getContentAsByteArray());
        assertEquals(dir.resolve(name), Files.list(dir).findFirst().orElseThrow());
    }

    @Test
    void storesPngAndWebpByMagicBytes() {
        UploadResponse png = uploads.storeImage(new MockMultipartFile(
                "file", "a.png", "", PNG));
        UploadResponse webp = uploads.storeImage(new MockMultipartFile(
                "file", "b.webp", "image/webp", WEBP));

        assertTrue(png.url().endsWith(".png"));
        assertTrue(webp.url().endsWith(".webp"));
    }

    @Test
    void rejectsNonImageAndOversize() {
        MockMultipartFile gif = new MockMultipartFile(
                "file", "a.gif", "image/gif", new byte[] {'G', 'I', 'F', '8', '9', 'a'});
        ApiException type = assertThrows(ApiException.class, () -> uploads.storeImage(gif));
        assertEquals("Dozwolone formaty: JPG, PNG, WebP", type.getMessage());

        byte[] big = new byte[33];
        System.arraycopy(JPEG, 0, big, 0, JPEG.length);
        MockMultipartFile huge = new MockMultipartFile("file", "big.jpg", "image/jpeg", big);
        ApiException size = assertThrows(ApiException.class, () -> uploads.storeImage(huge));
        assertTrue(size.getMessage().contains("za duży"));
    }

    @Test
    void imageReferenceAcceptsUploadPathAndHttps() {
        String path = "/api/uploads/0123456789abcdef0123456789abcdef.jpg";
        assertEquals(path, ImageReferences.normalize(path, true));
        assertEquals("https://cdn.example/a.jpg", ImageReferences.normalize("https://cdn.example/a.jpg", false));
        assertThrows(ApiException.class, () -> ImageReferences.normalize("/tmp/a.jpg", true));
        assertThrows(ApiException.class, () -> ImageReferences.normalize("   ", true));
    }
}
