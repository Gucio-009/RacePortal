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

class JwtServiceTest {

  private JwtService jwtService;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService("unit-test-secret-value-please-change", 7);
  }

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

  @Test
  void invalidTokenThrows() {
    assertThrows(JwtException.class, () -> jwtService.parseClaims("not.a.jwt"));
  }
}
