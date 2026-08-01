package pl.raceportal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import pl.raceportal.web.ErrorResponse;

@Component
public class JsonAuthHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {
  private final ObjectMapper mapper = new ObjectMapper();

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
      throws IOException {
    write(response, HttpServletResponse.SC_UNAUTHORIZED, "Wymagane logowanie");
  }

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
      throws IOException {
    write(response, HttpServletResponse.SC_FORBIDDEN, "Brak uprawnień");
  }

  private void write(HttpServletResponse response, int status, String error) throws IOException {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    mapper.writeValue(response.getOutputStream(), new ErrorResponse(error));
  }
}
