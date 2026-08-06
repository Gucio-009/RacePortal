package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.AuthDtos.AuthResponse;
import pl.raceportal.dto.AuthDtos.ChangePasswordRequest;
import pl.raceportal.dto.AuthDtos.ForgotPasswordRequest;
import pl.raceportal.dto.AuthDtos.GoogleLoginRequest;
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.dto.AuthDtos.MessageResponse;
import pl.raceportal.dto.AuthDtos.OAuthProvidersResponse;
import pl.raceportal.dto.AuthDtos.RegisterOrganizerRequest;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.RegisterResponse;
import pl.raceportal.dto.AuthDtos.ResendCodeRequest;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.dto.AuthDtos.UserDto;
import pl.raceportal.dto.AuthDtos.VerifyEmailRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.AuthService;

/**
 * REST API uwierzytelniania i profilu użytkownika.
 * <p>
 * Rola w architekturze: warstwa HTTP nad {@link AuthService} — rejestracja, JWT login,
 * Google OAuth, weryfikacja e-mail, {@code /me}. Endpointy publiczne vs {@code @PreAuthorize}.
 * Technologie: Spring Security (JWT + method security), Bean Validation, Google OAuth, Mail.
 * </p>
 * Pomysł (alt): OpenAPI generator z kontraktu; Keycloak realm endpoints zamiast własnego auth.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Rejestracja kierowcy — 201 + komunikat o kodzie (bez JWT). */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /** Rejestracja + wniosek organizatora (PENDING) — wymaga późniejszej weryfikacji e-mail. */
    @PostMapping("/register-organizer")
    public ResponseEntity<RegisterResponse> registerOrganizer(@Valid @RequestBody RegisterOrganizerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerOrganizer(request));
    }

    /** Weryfikacja kodu e-mail → JWT + UserDto. */
    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request.email(), request.code()));
    }

    /** Ponowna wysyłka kodu — zawsze ten sam komunikat (anti-enumeration). */
    @PostMapping("/resend-code")
    public ResponseEntity<MessageResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        authService.resendCode(request.email());
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje i nie jest jeszcze zweryfikowane, wysłaliśmy nowy kod."));
    }

    /** Logowanie lokalne email+hasło → JWT. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Które providery OAuth są włączone (np. Google Client ID). */
    @GetMapping("/oauth/providers")
    public ResponseEntity<OAuthProvidersResponse> oauthProviders() {
        return ResponseEntity.ok(new OAuthProvidersResponse(authService.isGoogleOAuthEnabled()));
    }

    /** Google Sign-In: idToken z frontu → weryfikacja → JWT RacePortal. */
    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.idToken()));
    }

    /** Forgot password — soft-fail, bez ujawniania istnienia konta. */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła na podany adres."));
    }

    /** Profil zalogowanego użytkownika (wymaga JWT). */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(authService.me(currentUser.getId()));
    }

    /** Aktualizacja profilu (username, avatar, dane osobowe, prawo jazdy / PZM). */
    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updateMe(@AuthenticationPrincipal UserPrincipal currentUser,
                                             @Valid @RequestBody UpdateMeRequest request) {
        return ResponseEntity.ok(authService.updateMe(currentUser.getId(), request));
    }

    /** Zmiana hasła — wymaga bieżącego hasła. */
    @PostMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Hasło zostało zmienione"));
    }
}
