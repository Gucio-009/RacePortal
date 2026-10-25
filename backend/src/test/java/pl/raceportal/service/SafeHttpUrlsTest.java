package pl.raceportal.service;

import org.junit.jupiter.api.Test;
import pl.raceportal.web.ApiException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SafeHttpUrlsTest {

    @Test
    void acceptsHttpAndHttps() {
        assertEquals("https://example.com/x", SafeHttpUrls.normalizeHttpUrl("https://example.com/x", "Link"));
        assertEquals("http://example.com", SafeHttpUrls.normalizeHttpUrl("http://example.com", "Link"));
        assertNull(SafeHttpUrls.normalizeHttpUrl("  ", "Link"));
    }

    @Test
    void rejectsJavascriptAndData() {
        assertThrows(ApiException.class, () -> SafeHttpUrls.normalizeHttpUrl("javascript:alert(1)", "Link"));
        assertThrows(ApiException.class, () -> SafeHttpUrls.normalizeHttpUrl("data:text/html,hi", "Link"));
        assertThrows(ApiException.class, () -> SafeHttpUrls.normalizeHttpUrl("//evil.com", "Link"));
    }

    @Test
    void paymentProofAllowsUploadPath() {
        String path = "/api/uploads/0123456789abcdef0123456789abcdef.jpg";
        assertEquals(path, SafeHttpUrls.normalizeHttpUrlOrUpload(path, "Dowód"));
        assertThrows(ApiException.class,
                () -> SafeHttpUrls.normalizeHttpUrlOrUpload("javascript:alert(1)", "Dowód"));
    }
}
