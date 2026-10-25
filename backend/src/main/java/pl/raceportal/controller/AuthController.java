package pl.raceportal.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import pl.raceportal.dto.AuthDtos.ConfirmEmailChangeRequest;
import pl.raceportal.dto.AuthDtos.ForgotPasswordRequest;
import pl.raceportal.dto.AuthDtos.GoogleLoginRequest;
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.dto.AuthDtos.MessageResponse;
import pl.raceportal.dto.AuthDtos.OAuthProvidersResponse;
import pl.raceportal.dto.AuthDtos.RefreshRequest;
import pl.raceportal.dto.AuthDtos.RegisterOrganizerRequest;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.RegisterResponse;
import pl.raceportal.dto.AuthDtos.RequestEmailChangeRequest;
import pl.raceportal.dto.AuthDtos.ResendCodeRequest;
import pl.raceportal.dto.AuthDtos.ResetPasswordRequest;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.dto.AuthDtos.UserDto;
import pl.raceportal.dto.AuthDtos.VerifyEmailRequest;
import pl.raceportal.security.AuthCookies;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.AuthService;
import pl.raceportal.web.ClientIp;

/**
 * Auth HTTP: rejestracja, login, cookies httpOnly (access+refresh), logout, profil.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookies authCookies;

    public AuthController(AuthService authService, AuthCookies authCookies) {
        this.authService = authService;
        this.authCookies = authCookies;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/register-organizer")
    public ResponseEntity<RegisterResponse> registerOrganizer(@Valid @RequestBody RegisterOrganizerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerOrganizer(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request,
                                                     HttpServletResponse response) {
        return ResponseEntity.ok(attachCookies(authService.verifyEmail(request.email(), request.token()), response));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<MessageResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        authService.resendCode(request.email());
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje i nie jest jeszcze zweryfikowane, wysłaliśmy nowy link aktywacyjny."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest requestHttp,
                                               HttpServletResponse response) {
        return ResponseEntity.ok(attachCookies(
                authService.login(request, ClientIp.from(requestHttp)), response));
    }

    @GetMapping("/oauth/providers")
    public ResponseEntity<OAuthProvidersResponse> oauthProviders() {
        return ResponseEntity.ok(new OAuthProvidersResponse(authService.isGoogleOAuthEnabled()));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request,
                                                         HttpServletRequest requestHttp,
                                                         HttpServletResponse response) {
        return ResponseEntity.ok(attachCookies(
                authService.loginWithGoogle(request.idToken(), ClientIp.from(requestHttp)), response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                           HttpServletRequest requestHttp) {
        authService.forgotPassword(request.email(), ClientIp.from(requestHttp));
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Hasło zostało zmienione. Możesz się zalogować."));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(authService.me(currentUser.getId()));
    }

    /**
     * Odświeżenie sesji refresh tokenem (cookie {@code rp_rt} lub body).
     * Nie wymaga ważnego access JWT.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody(required = false) RefreshRequest body,
                                                 HttpServletRequest request,
                                                 HttpServletResponse response) {
        String raw = firstNonBlank(
                body == null ? null : body.refreshToken(),
                authCookies.readRefresh(request));
        return ResponseEntity.ok(attachCookies(authService.refreshSession(raw), response));
    }

    /** Wylogowanie — kasuje cookies, revoke refresh, bump tokenVersion. */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@AuthenticationPrincipal UserPrincipal currentUser,
                                                   HttpServletRequest request,
                                                   HttpServletResponse response) {
        String userId = currentUser != null ? currentUser.getId() : null;
        authService.logout(userId, authCookies.readRefresh(request));
        authCookies.clear(response);
        return ResponseEntity.ok(new MessageResponse("Wylogowano"));
    }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updateMe(@AuthenticationPrincipal UserPrincipal currentUser,
                                             @Valid @RequestBody UpdateMeRequest request) {
        return ResponseEntity.ok(authService.updateMe(currentUser.getId(), request));
    }

    @PostMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @Valid @RequestBody ChangePasswordRequest request,
                                                            HttpServletResponse response) {
        authService.changePassword(currentUser.getId(), request);
        authCookies.clear(response);
        return ResponseEntity.ok(new MessageResponse("Hasło zostało zmienione – zaloguj się ponownie"));
    }

    @PostMapping("/me/email-change")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> requestEmailChange(@AuthenticationPrincipal UserPrincipal currentUser,
                                                               @Valid @RequestBody RequestEmailChangeRequest request) {
        return ResponseEntity.ok(authService.requestEmailChange(currentUser.getId(), request.newEmail()));
    }

    @PostMapping("/me/email-change/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AuthResponse> confirmEmailChange(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @Valid @RequestBody ConfirmEmailChangeRequest request,
                                                            HttpServletResponse response) {
        return ResponseEntity.ok(attachCookies(
                authService.confirmEmailChange(currentUser.getId(), request.token()), response));
    }

    private AuthResponse attachCookies(AuthResponse auth, HttpServletResponse response) {
        authCookies.setAccessToken(response, auth.token(), authService.accessTokenTtl());
        authCookies.setRefreshToken(response, auth.refreshToken(), authService.refreshTokenTtl());
        return auth;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a.trim();
        if (b != null && !b.isBlank()) return b.trim();
        return null;
    }
}
