package pl.raceportal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Kontrakty DTO warstwy auth (request/response) — synchronizowane z pakietem {@code api-types}.
 * <p>
 * Rola w architekturze: walidowane body dla {@code AuthController}; brak logiki biznesowej.
 * Technologie: Jakarta Bean Validation, Jackson (records).
 * </p>
 * Pomysł (alt): MapStruct User↔UserDto; OpenAPI generator zamiast ręcznych recordów.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    /** Rejestracja kierowcy — pola profilu opcjonalne (prawo jazdy B / PZM). */
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 40) String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @Size(max = 80) String firstName,
            @Size(max = 80) String lastName,
            @Size(max = 30) String phone,
            Boolean hasDrivingLicenseB,
            @Size(max = 40) String pzmLicense
    ) {
    }

    /** Rejestracja z wnioskiem o rolę organizatora ({@code company} wymagane). */
    public record RegisterOrganizerRequest(
            @NotBlank @Size(min = 2, max = 40) String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank @Size(min = 2, max = 120) String company,
            @Size(max = 2000) String message
    ) {
    }

    /** Odpowiedź po rejestracji — bez JWT, wymaga weryfikacji e-mail. */
    public record RegisterResponse(
            boolean requiresVerification,
            String email,
            String message
    ) {
    }

    public record VerifyEmailRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String code
    ) {
    }

    public record ResendCodeRequest(
            @NotBlank @Email String email
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    /** Google ID Token z frontendu (Sign-In / One Tap). */
    public record GoogleLoginRequest(
            @NotBlank @Size(min = 20, max = 4096) String idToken
    ) {
    }

    public record OAuthProvidersResponse(
            boolean google
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank @Email String email
    ) {
    }

    public record UpdateMeRequest(
            @Size(min = 2, max = 40) String username,
            String avatar,
            @Size(max = 80) String firstName,
            @Size(max = 80) String lastName,
            @Size(max = 30) String phone,
            Boolean hasDrivingLicenseB,
            @Size(max = 40) String pzmLicense
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, max = 100) String newPassword
    ) {
    }

    /** Publiczny profil użytkownika zwracany z JWT. */
    public record UserDto(
            String id,
            String email,
            String username,
            String role,
            String avatar,
            String memberSince,
            String firstName,
            String lastName,
            String phone,
            boolean hasDrivingLicenseB,
            String pzmLicense
    ) {
    }

    /** Sukces logowania / verify / OAuth — Bearer token + user. */
    public record AuthResponse(
            String token,
            UserDto user
    ) {
    }

    public record MessageResponse(
            String message
    ) {
    }
}
