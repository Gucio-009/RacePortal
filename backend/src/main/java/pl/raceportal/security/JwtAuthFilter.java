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
import pl.raceportal.domain.User;
import pl.raceportal.repository.UserRepository;

import java.io.IOException;

/**
 * Filtr HTTP: odczytuje nagłówek {@code Authorization: Bearer &lt;jwt&gt;}
 * i ustawia autentyczację w {@link SecurityContextHolder}.
 * <p>
 * Rola jest zawsze ładowana z bazy (nie z claim JWT), żeby po APPROVE wniosku
 * organizatora / zmianie roli w adminie uprawnienia działały bez ponownego logowania.
 * </p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                UserPrincipal fromToken = jwtService.toPrincipal(jwtService.parseClaims(token));
                User user = userRepository.findById(fromToken.getId()).orElse(null);
                if (user == null) {
                    SecurityContextHolder.clearContext();
                } else {
                    UserPrincipal principal = UserPrincipal.fromUser(user);
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
