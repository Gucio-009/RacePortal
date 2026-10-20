package pl.raceportal.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import pl.raceportal.web.ApiException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Weryfikacja Google ID Token (Sign-In with Google / One Tap).
 * <p>
 * Rola w architekturze: warstwa OAuth — {@code AuthService} przekazuje idToken
 * z frontendu; po sukcesie tworzy/loguje użytkownika i wystawia własne JWT.
 * Technologie: Google API Client ({@link GoogleIdTokenVerifier}), Spring Boot config
 * ({@code app.oauth.google.client-id}).
 * </p>
 * Reguły: wymaga skonfigurowanego Client ID; email z tokenu musi być verified.
 * Gdy Client ID pusty — OAuth wyłączony (503 przy próbie użycia).
 * <p>
 * Pomysł (alt): Spring Security OAuth2 Client (authorization code flow) zamiast
 * weryfikacji idToken po stronie API; Keycloak jako broker Google.
 * </p>
 */
@Component
public class GoogleIdTokenService {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenService(@Value("${app.oauth.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
        if (this.clientId.isBlank()) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.clientId))
                    .build();
        }
    }

    /** Czy Google OAuth jest skonfigurowany (Client ID obecny). */
    public boolean isConfigured() {
        return verifier != null;
    }

    /**
     * Weryfikuje podpis i audience idToken; wymaga zweryfikowanego emaila Google.
     *
     * @return payload z email / sub / name / picture
     */
    public GoogleIdToken.Payload verify(String idTokenString) {
        if (verifier == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Logowanie Google nie jest skonfigurowane (brak GOOGLE_OAUTH_CLIENT_ID)");
        }
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw ApiException.unauthorized("Nieprawidłowy token Google");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw ApiException.unauthorized("Konto Google nie ma zweryfikowanego e-maila");
            }
            return payload;
        } catch (GeneralSecurityException | IOException e) {
            throw ApiException.unauthorized("Nie udało się zweryfikować tokenu Google");
        }
    }
}
