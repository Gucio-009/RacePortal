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
 * Serwis wystawiania i weryfikacji tokenów JWT (JJWT).
 * <p>
 * Rola w architekturze: po udanym logowaniu / OAuth generuje Bearer token;
 * {@link JwtAuthFilter} parsuje claims i buduje {@link UserPrincipal}.
 * Technologie: JJWT (HMAC-SHA), Spring Boot ({@code app.jwt.secret}, expiration).
 * </p>
 * Claims: {@code id}, {@code email}, {@code username}, {@code role} — rola trafia
 * do authorities jako {@code ROLE_*}. Sekret jest hashowany SHA-256 do klucza HMAC.
 * <p>
 * Pomysł (alt): Keycloak / Spring Authorization Server; refresh tokens w Redis;
 * asymetryczne RS256 zamiast HMAC.
 * </p>
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMillis;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiration-days:7}") long expirationDays) {
        this.key = Keys.hmacShaKeyFor(sha256(secret));
        this.expirationMillis = Duration.ofDays(expirationDays).toMillis();
    }

    /** Normalizuje sekret konfiguracyjny do 256-bitowego klucza HMAC. */
    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * Generuje podpisany JWT dla zalogowanego użytkownika (subject = id użytkownika).
     */
    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId())
                .claim("id", user.getId())
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMillis)))
                .signWith(key)
                .compact();
    }

    /**
     * Weryfikuje podpis i ważność tokenu; rzuca {@link JwtException} przy błędzie.
     */
    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Mapuje claims JWT na {@link UserPrincipal} używany w SecurityContext
     * (bez passwordHash — nie jest potrzebny w filtrze).
     */
    public UserPrincipal toPrincipal(Claims claims) {
        String id = claims.get("id", String.class);
        String email = claims.get("email", String.class);
        String username = claims.get("username", String.class);
        String roleValue = claims.get("role", String.class);
        return new UserPrincipal(id, email, username, null, Role.valueOf(roleValue));
    }
}
