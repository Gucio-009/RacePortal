package pl.raceportal.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtr HTTP: odczytuje nagłówek {@code Authorization: Bearer &lt;jwt&gt;}
 * i ustawia autentyczację w {@link SecurityContextHolder}.
 * <p>
 * Rola w architekturze: most między JWT a Spring Security — działa przed
 * {@code UsernamePasswordAuthenticationFilter}. Nieprawidłowy token czyści kontekst
 * (request idzie dalej; chronione endpointy zwrócą 401).
 * Technologie: Spring Security, JJWT.
 * </p>
 * Pomysł (alt): Spring OAuth2 Resource Server ({@code jwt} decoder) zamiast własnego filtra.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Jeśli jest Bearer token — parsuje claims i ustawia {@link UserPrincipal};
     * przy błędzie JWT czyści kontekst i kontynuuje łańcuch.
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                UserPrincipal principal = jwtService.toPrincipal(jwtService.parseClaims(token));
                var authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
