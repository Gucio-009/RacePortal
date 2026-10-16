package pl.raceportal.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Blokuje niebezpieczne defaulty (słaby JWT, włączony seed) poza trybem demo/dev.
 * Lokalnie i w Compose: {@code app.security.allow-insecure-defaults=true}.
 */
@Component
public class SecurityDefaultsValidator {

    private static final Logger log = LoggerFactory.getLogger(SecurityDefaultsValidator.class);
    static final String INSECURE_JWT_DEFAULT = "raceportal-dev-secret-change-me";

    private final String jwtSecret;
    private final boolean seedEnabled;
    private final boolean allowInsecureDefaults;

    public SecurityDefaultsValidator(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.seed.enabled:false}") boolean seedEnabled,
            @Value("${app.security.allow-insecure-defaults:true}") boolean allowInsecureDefaults) {
        this.jwtSecret = jwtSecret;
        this.seedEnabled = seedEnabled;
        this.allowInsecureDefaults = allowInsecureDefaults;
    }

    @PostConstruct
    void validate() {
        boolean insecureJwt = jwtSecret == null || jwtSecret.isBlank()
                || INSECURE_JWT_DEFAULT.equals(jwtSecret);
        if (allowInsecureDefaults) {
            if (insecureJwt || seedEnabled) {
                log.warn("Insecure defaults allowed (JWT default={}, seed={}). "
                                + "Set ALLOW_INSECURE_DEFAULTS=false outside demo.",
                        insecureJwt, seedEnabled);
            }
            return;
        }
        if (insecureJwt) {
            throw new IllegalStateException(
                    "JWT_SECRET musi być ustawiony na silną wartość (nie domyślny secret demo). "
                            + "Albo ustaw ALLOW_INSECURE_DEFAULTS=true tylko lokalnie.");
        }
        if (seedEnabled) {
            throw new IllegalStateException(
                    "SEED_ENABLED=true jest zabronione gdy ALLOW_INSECURE_DEFAULTS=false.");
        }
    }
}
