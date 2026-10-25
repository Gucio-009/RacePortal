package pl.raceportal.security;

import org.springframework.stereotype.Component;
import pl.raceportal.web.ApiException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory limiter prób (login / forgot / verify) — MVP bez Redis.
 * Przekroczenie limitu → HTTP 429 (nie 400).
 */
@Component
public class AttemptRateLimiter {

    private static final String DEFAULT_MESSAGE =
            "Zbyt wiele prób. Spróbuj ponownie za kilka minut.";

    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    /**
     * Sprawdza limit i od razu rejestruje próbę (forgot-password, resend, bug-report).
     */
    public void check(String key, int maxAttempts, Duration window) {
        check(key, maxAttempts, window, DEFAULT_MESSAGE);
    }

    public void check(String key, int maxAttempts, Duration window, String message) {
        Instant now = Instant.now();
        Deque<Instant> q = queue(key);
        synchronized (q) {
            prune(q, now.minus(window));
            if (q.size() >= maxAttempts) {
                throw ApiException.tooManyRequests(message, retryAfterSeconds(q, window, now));
            }
            q.addLast(now);
        }
    }

    /** Tylko sprawdzenie — bez zapisu (przed logowaniem). */
    public void ensureAllowed(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();
        Deque<Instant> q = queue(key);
        synchronized (q) {
            prune(q, now.minus(window));
            if (q.size() >= maxAttempts) {
                throw ApiException.tooManyRequests(DEFAULT_MESSAGE, retryAfterSeconds(q, window, now));
            }
        }
    }

    /** Rejestruje nieudaną próbę (np. złe hasło). */
    public void record(String key, Duration window) {
        Instant now = Instant.now();
        Deque<Instant> q = queue(key);
        synchronized (q) {
            prune(q, now.minus(window));
            q.addLast(now);
        }
    }

    private Deque<Instant> queue(String key) {
        return attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
    }

    private static void prune(Deque<Instant> q, Instant cutoff) {
        while (!q.isEmpty() && q.peekFirst().isBefore(cutoff)) {
            q.removeFirst();
        }
    }

    private static long retryAfterSeconds(Deque<Instant> q, Duration window, Instant now) {
        if (q.isEmpty()) {
            return window.toSeconds();
        }
        Instant unlockAt = q.peekFirst().plus(window);
        long sec = Duration.between(now, unlockAt).getSeconds();
        return Math.max(1, sec);
    }
}
