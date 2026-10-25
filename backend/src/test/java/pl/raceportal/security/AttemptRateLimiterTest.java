package pl.raceportal.security;

import org.junit.jupiter.api.Test;
import pl.raceportal.web.ApiException;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttemptRateLimiterTest {

    @Test
    void checkThrows429AfterLimit() {
        AttemptRateLimiter limiter = new AttemptRateLimiter();
        Duration window = Duration.ofMinutes(15);
        assertDoesNotThrow(() -> limiter.check("k", 2, window));
        assertDoesNotThrow(() -> limiter.check("k", 2, window));
        ApiException ex = assertThrows(ApiException.class, () -> limiter.check("k", 2, window));
        assertEquals(429, ex.getStatus().value());
    }

    @Test
    void ensureAllowedDoesNotRecordUntilRecordCalled() {
        AttemptRateLimiter limiter = new AttemptRateLimiter();
        Duration window = Duration.ofMinutes(15);
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(() -> limiter.ensureAllowed("login", 3, window));
        }
        limiter.record("login", window);
        limiter.record("login", window);
        limiter.record("login", window);
        ApiException ex = assertThrows(ApiException.class, () -> limiter.ensureAllowed("login", 3, window));
        assertEquals(429, ex.getStatus().value());
    }
}
