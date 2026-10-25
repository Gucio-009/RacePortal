package pl.raceportal.security;

import io.jsonwebtoken.Claims;
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
 * Odczyt access JWT z {@code Authorization: Bearer} albo cookie {@code rp_at}.
 * Rola z DB; claim {@code tv} musi zgadzać się z {@code User.tokenVersion}.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthCookies authCookies;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository, AuthCookies authCookies) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authCookies = authCookies;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = resolveAccessToken(request);
        if (token != null) {
            try {
                Claims claims = jwtService.parseClaims(token);
                UserPrincipal fromToken = jwtService.toPrincipal(claims);
                User user = userRepository.findById(fromToken.getId()).orElse(null);
                if (user == null || jwtService.tokenVersion(claims) != user.getTokenVersion()) {
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

    private String resolveAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String bearer = header.substring(BEARER_PREFIX.length()).trim();
            if (!bearer.isEmpty()) {
                return bearer;
            }
        }
        return authCookies.readAccess(request);
    }
}
