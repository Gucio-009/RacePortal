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
 * Prosty in-memory limiter prób (verify-email / resend-code) — MVP bez Redis.
 */
@Component
public class AttemptRateLimiter {

    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public void check(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> q = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst().isBefore(cutoff)) {
                q.removeFirst();
            }
            if (q.size() >= maxAttempts) {
                throw ApiException.badRequest(
                        "Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
            }
            q.addLast(now);
        }
    }
}
