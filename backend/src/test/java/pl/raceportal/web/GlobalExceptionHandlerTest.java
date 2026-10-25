package pl.raceportal.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Testy jednostkowe mapowania wyjątków w {@link GlobalExceptionHandler}.
 * <p>
 * Rola w architekturze testów: gwarantuje spójne kody HTTP i komunikaty PL
 * dla ApiException, 403, 401 i catch-all 500.
 * Technologie: JUnit 5, Spring HttpStatus (bez pełnego kontekstu MVC).
 * </p>
 * Pomysł (alt): {@code @WebMvcTest} z MockMvc dla pełnego łańcucha serializacji JSON.
 */
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

  @Test
  void noResourceReturns404() {
    ResponseEntity<ErrorResponse> res =
        handler.handleNoResource(new NoResourceFoundException(HttpMethod.GET, "/api/missing"));
    assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
    assertEquals("Nie znaleziono", res.getBody().error());
  }

  @Test
  void methodNotSupportedReturns405() {
    ResponseEntity<ErrorResponse> res = handler.handleMethodNotSupported(
        new HttpRequestMethodNotSupportedException("DELETE"));
    assertEquals(HttpStatus.METHOD_NOT_ALLOWED, res.getStatusCode());
    assertEquals("Metoda niedozwolona", res.getBody().error());
  }
}
