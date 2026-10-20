package pl.raceportal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import pl.raceportal.web.ErrorResponse;

import java.io.IOException;

/**
 * Handler odmowy dostępu (użytkownik zalogowany, ale bez wymaganej roli) — JSON 403.
 * <p>
 * Rola w architekturze: spójny format błędów RBAC z resztą API ({@link ErrorResponse}).
 * Technologie: Spring Security, Jackson.
 * </p>
 * Pomysł (alt): Problem Details (RFC 7807) z polem {@code type} wskazującym brak roli.
 */
@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public JsonAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Odpowiedź 403 z komunikatem „Brak uprawnień”. */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(new ErrorResponse("Brak uprawnień")));
    }
}
