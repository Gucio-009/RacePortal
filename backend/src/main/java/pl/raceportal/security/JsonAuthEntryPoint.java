package pl.raceportal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import pl.raceportal.web.ErrorResponse;

import java.io.IOException;

/**
 * Entry point dla nieautoryzowanych żądań (brak / nieważny JWT) — zwraca JSON 401.
 * <p>
 * Rola w architekturze: zamiast domyślnego redirectu do formularza logowania
 * (nieadekwatnego dla SPA/API) zwraca {@link ErrorResponse}.
 * Technologie: Spring Security, Jackson.
 * </p>
 * Pomysł (alt): RFC 7807 Problem Details ({@code application/problem+json}).
 */
@Component
public class JsonAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JsonAuthEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Odpowiedź 401 z komunikatem „Brak autoryzacji”. */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(new ErrorResponse("Brak autoryzacji")));
    }
}
