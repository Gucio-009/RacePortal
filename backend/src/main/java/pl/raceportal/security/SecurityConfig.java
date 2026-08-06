package pl.raceportal.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Konfiguracja Spring Security dla API RacePortal (stateless JWT).
 * <p>
 * Rola w architekturze: definiuje łańcuch filtrów, publiczne vs chronione endpointy,
 * CORS oraz handlerów błędów auth/RBAC. Metody kontrolerów mogą dodatkowo używać
 * {@code @PreAuthorize} dzięki {@link EnableMethodSecurity}.
 * </p>
 * Technologie: Spring Security, JWT ({@link JwtAuthFilter}), BCrypt, CORS.
 * <p>
 * Reguły dostępu (skrót):
 * <ul>
 *   <li>publiczne: health, login/register/OAuth/verify, GET wydarzeń, POST trasy map;</li>
 *   <li>pozostałe: wymagają ważnego Bearer JWT.</li>
 * </ul>
 * Pomysł (alt): Keycloak / OAuth2 Resource Server zamiast własnego filtra JWT;
 * Redis do blacklisty tokenów przy wylogowaniu.
 * </p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JsonAuthEntryPoint jsonAuthEntryPoint;
    private final JsonAccessDeniedHandler jsonAccessDeniedHandler;

    /** Dozwolone originy frontendu (CSV lub {@code *}) z konfiguracji. */
    @Value("${app.cors.origin:*}")
    private String corsOrigin;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                           JsonAuthEntryPoint jsonAuthEntryPoint,
                           JsonAccessDeniedHandler jsonAccessDeniedHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.jsonAuthEntryPoint = jsonAuthEntryPoint;
        this.jsonAccessDeniedHandler = jsonAccessDeniedHandler;
    }

    /** Encoder haseł — BCrypt używany przy rejestracji i logowaniu lokalnym. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Buduje łańcuch filtrów: bez CSRF (API tokenowe), sesja STATELESS,
     * JWT przed UsernamePasswordAuthenticationFilter, mapowanie ścieżek publicznych.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(jsonAuthEntryPoint)
                        .accessDeniedHandler(jsonAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register",
                                "/api/auth/register-organizer", "/api/auth/verify-email", "/api/auth/resend-code",
                                "/api/auth/forgot-password", "/api/auth/oauth/google").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/oauth/providers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/**", "/api/events/meta/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/maps/route").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Konfiguracja CORS z {@code app.cors.origin} — wspiera listę originów lub wildcard.
     * Credentials włączone (cookies/Authorization z przeglądarki SPA).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsOrigin.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        if (origins.isEmpty() || origins.contains("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            configuration.setAllowedOrigins(origins);
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
