package pl.raceportal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    /** Min. 8 znaków, 1 wielka, 1 cyfra, 1 znak specjalny — nowe hasła (rejestracja / zmiana / reset). */
    public static final String STRONG_PASSWORD_REGEXP =
            "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,100}$";
    public static final String STRONG_PASSWORD_MESSAGE =
            "Hasło: min. 8 znaków, wielka litera, cyfra i znak specjalny";

    private AuthDtos() {
    }

    /** Rejestracja kierowcy — pola profilu opcjonalne (prawo jazdy B / PZM). */
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 40) String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = STRONG_PASSWORD_REGEXP, message = STRONG_PASSWORD_MESSAGE)
            String password,
            @Size(max = 50)
            @Pattern(regexp = "^$|^[\\p{L}][\\p{L}\\s'-]{1,49}$", message = "Imię: tylko litery (2–50)")
            String firstName,
            @Size(max = 50)
            @Pattern(regexp = "^$|^[\\p{L}][\\p{L}\\s'-]{1,49}$", message = "Nazwisko: tylko litery (2–50)")
            String lastName,
            @Size(max = 16)
            @Pattern(regexp = "^$|^\\+?[0-9\\s-]{9,16}$", message = "Telefon: nieprawidłowy format")
            String phone,
            @Size(max = 255) String address,
            @Size(max = 500)
            @Pattern(
                    regexp = "^$|^(https?://)?(www\\.)?instagram\\.com/.+$",
                    message = "Instagram: podaj URL instagram.com"
            )
            String instagramUrl,
            Boolean hasDrivingLicenseB,
            @Size(max = 40) String pzmLicense
    ) {
    }

    /** Rejestracja z wnioskiem o rolę organizatora ({@code company} wymagane). */
    public record RegisterOrganizerRequest(
            @NotBlank @Size(min = 2, max = 40) String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = STRONG_PASSWORD_REGEXP, message = STRONG_PASSWORD_MESSAGE)
            String password,
            @NotBlank @Size(min = 2, max = 120) String company,
            @NotBlank @Size(max = 60) String businessType,
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

    /** Aktywacja konta (lub potwierdzenie zmiany e-maila) tokenem z linku. */
    public record VerifyEmailRequest(
            @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 20, max = 64) String token
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

    /** Ustawienie nowego hasła po kliknięciu linku z maila (token w ścieżce / body). */
    public record ResetPasswordRequest(
            @NotBlank @Size(min = 20, max = 64) String token,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = STRONG_PASSWORD_REGEXP, message = STRONG_PASSWORD_MESSAGE)
            String newPassword
    ) {
    }

    /** Start zmiany e-maila — kod idzie na nowy adres. */
    public record RequestEmailChangeRequest(
            @NotBlank @Email @Size(max = 190) String newEmail
    ) {
    }

    /** Potwierdzenie zmiany e-maila tokenem (ten sam co w linku aktywacyjnym). */
    public record ConfirmEmailChangeRequest(
            @NotBlank @Size(min = 20, max = 64) String token
    ) {
    }

    public record UpdateMeRequest(
            @Size(min = 2, max = 40) String username,
            String avatar,
            @Size(max = 50)
            @Pattern(regexp = "^$|^[\\p{L}][\\p{L}\\s'-]{1,49}$", message = "Imię: tylko litery (2–50)")
            String firstName,
            @Size(max = 50)
            @Pattern(regexp = "^$|^[\\p{L}][\\p{L}\\s'-]{1,49}$", message = "Nazwisko: tylko litery (2–50)")
            String lastName,
            @Size(max = 16)
            @Pattern(regexp = "^$|^\\+?[0-9\\s-]{9,16}$", message = "Telefon: nieprawidłowy format")
            String phone,
            @Size(max = 255) String address,
            @Size(max = 500)
            @Pattern(
                    regexp = "^$|^(https?://)?(www\\.)?instagram\\.com/.+$",
                    message = "Instagram: podaj URL instagram.com"
            )
            String instagramUrl,
            Boolean hasDrivingLicenseB,
            @Size(max = 40) String pzmLicense
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = STRONG_PASSWORD_REGEXP, message = STRONG_PASSWORD_MESSAGE)
            String newPassword
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
            String address,
            String instagramUrl,
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
