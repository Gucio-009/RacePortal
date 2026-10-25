package pl.raceportal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Krótko żyjące access JWT (minuty) z claimem {@code tv} (tokenVersion użytkownika).
 * Refresh tokeny są osobne (DB + cookie) — patrz {@code RefreshTokenService}.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration accessTtl;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.access-token-minutes:15}") long accessTokenMinutes) {
        this.key = Keys.hmacShaKeyFor(sha256(secret));
        this.accessTtl = Duration.ofMinutes(Math.max(1, accessTokenMinutes));
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public Duration getAccessTtl() {
        return accessTtl;
    }

    /** Access token — subject = user id, claim tv = tokenVersion. */
    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId())
                .claim("id", user.getId())
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .claim("tv", user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTtl)))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public int tokenVersion(Claims claims) {
        Number tv = claims.get("tv", Number.class);
        return tv == null ? 0 : tv.intValue();
    }

    public UserPrincipal toPrincipal(Claims claims) {
        String id = claims.get("id", String.class);
        String email = claims.get("email", String.class);
        String username = claims.get("username", String.class);
        String roleValue = claims.get("role", String.class);
        return new UserPrincipal(id, email, username, null, Role.valueOf(roleValue));
    }
}
