package pl.raceportal.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;

/**
 * Testy jednostkowe {@link JwtService} — generowanie, parsowanie claims i błędy tokenu.
 * <p>
 * Rola w architekturze testów: izolowana weryfikacja warstwy JWT bez Spring kontekstu.
 * Technologie: JUnit 5, JJWT.
 * </p>
 * Pomysł (alt): property-based tests (jqwik) na round-trip tokenów.
 */
class JwtServiceTest {

  private JwtService jwtService;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService("unit-test-secret-value-please-change", 7);
  }

  /** Round-trip: User → token → claims → UserPrincipal z rolą ADMIN. */
  @Test
  void generateAndParseClaims() {
    User user = new User();
    user.setId("user-1");
    user.setEmail("a@b.pl");
    user.setUsername("Alice");
    user.setRole(Role.ADMIN);

    String token = jwtService.generateToken(user);
    assertNotNull(token);

    Claims claims = jwtService.parseClaims(token);
    assertEquals("user-1", claims.get("id", String.class));
    assertEquals("ADMIN", claims.get("role", String.class));
    assertEquals("a@b.pl", claims.get("email", String.class));

    UserPrincipal principal = jwtService.toPrincipal(claims);
    assertEquals(Role.ADMIN, principal.getRole());
    assertEquals("user-1", principal.getId());
  }

  /** Niepoprawny string JWT musi rzucić {@link JwtException}. */
  @Test
  void invalidTokenThrows() {
    assertThrows(JwtException.class, () -> jwtService.parseClaims("not.a.jwt"));
  }
}
