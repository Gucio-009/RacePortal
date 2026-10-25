package pl.raceportal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.RefreshToken;
import pl.raceportal.domain.User;
import pl.raceportal.repository.RefreshTokenRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.web.ApiException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Rotowane refresh tokeny z wykrywaniem ponownego użycia (pentest #2).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final Duration refreshTtl;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            @Value("${app.jwt.refresh-token-days:7}") long refreshTokenDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.refreshTtl = Duration.ofDays(Math.max(1, refreshTokenDays));
    }

    public Duration getRefreshTtl() {
        return refreshTtl;
    }

    /** Tworzy nowy refresh dla użytkownika; zwraca surowy token (do cookie/body). */
    @Transactional
    public String issue(User user) {
        String raw = randomToken();
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(raw));
        entity.setExpiresAt(Instant.now().plus(refreshTtl));
        refreshTokenRepository.save(entity);
        return raw;
    }

    /**
     * Waliduje i rotuje refresh. Przy reuse unieważnia wszystkie sesje użytkownika.
     *
     * @return user + nowy surowy refresh
     */
    @Transactional
    public RotatedRefresh rotate(String rawRefresh) {
        if (rawRefresh == null || rawRefresh.isBlank()) {
            throw ApiException.unauthorized("Brak sesji");
        }
        String hash = hash(rawRefresh.trim());
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash).orElse(null);
        if (existing == null) {
            throw ApiException.unauthorized("Sesja wygasła – zaloguj się ponownie");
        }

        if (existing.isRevoked() || existing.getReplacedByHash() != null) {
            // Reuse po rotacji → kradzież: zabij wszystkie sesje
            User user = existing.getUser();
            revokeAllAndBump(user);
            throw ApiException.unauthorized("Sesja unieważniona – zaloguj się ponownie");
        }

        if (Instant.now().isAfter(existing.getExpiresAt())) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            throw ApiException.unauthorized("Sesja wygasła – zaloguj się ponownie");
        }

        User user = existing.getUser();
        String newRaw = randomToken();
        String newHash = hash(newRaw);

        RefreshToken next = new RefreshToken();
        next.setUser(user);
        next.setTokenHash(newHash);
        next.setExpiresAt(Instant.now().plus(refreshTtl));
        refreshTokenRepository.save(next);

        existing.setRevoked(true);
        existing.setReplacedByHash(newHash);
        refreshTokenRepository.save(existing);

        return new RotatedRefresh(user, newRaw);
    }

    @Transactional(readOnly = true)
    public Optional<User> findUserByRaw(String rawRefresh) {
        if (rawRefresh == null || rawRefresh.isBlank()) {
            return Optional.empty();
        }
        return refreshTokenRepository.findByTokenHash(hash(rawRefresh.trim())).map(RefreshToken::getUser);
    }

    @Transactional
    public void revokeRaw(String rawRefresh) {
        if (rawRefresh == null || rawRefresh.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hash(rawRefresh.trim())).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllAndBump(User user) {
        refreshTokenRepository.revokeAllForUser(user.getId());
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    public record RotatedRefresh(User user, String rawRefresh) {
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
