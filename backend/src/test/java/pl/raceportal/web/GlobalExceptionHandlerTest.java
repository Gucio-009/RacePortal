package pl.raceportal.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void apiExceptionMapsStatusAndBody() {
    ResponseEntity<ErrorResponse> res =
        handler.handleApiException(new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono"));
    assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
    assertEquals("Nie znaleziono", res.getBody().error());
    assertNull(res.getBody().details());
  }

  @Test
  void accessDeniedReturns403() {
    ResponseEntity<ErrorResponse> res = handler.handleAccessDenied(new AccessDeniedException("x"));
    assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
    assertEquals("Brak uprawnień", res.getBody().error());
  }

  @Test
  void badCredentialsReturns401() {
    ResponseEntity<ErrorResponse> res = handler.handleBadCredentials(new BadCredentialsException("x"));
    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals("Nieprawidłowy email lub hasło", res.getBody().error());
  }

  @Test
  void genericReturns500() {
    ResponseEntity<ErrorResponse> res = handler.handleGeneric(new RuntimeException("boom"));
    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, res.getStatusCode());
    assertEquals("Błąd serwera", res.getBody().error());
  }
}
