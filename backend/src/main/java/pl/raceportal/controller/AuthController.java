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
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.dto.AuthDtos.MessageResponse;
import pl.raceportal.dto.AuthDtos.RegisterOrganizerRequest;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.RegisterResponse;
import pl.raceportal.dto.AuthDtos.ResendCodeRequest;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.dto.AuthDtos.UserDto;
import pl.raceportal.dto.AuthDtos.VerifyEmailRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request.email(), request.code()));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<MessageResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        authService.resendCode(request.email());
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje i nie jest jeszcze zweryfikowane, wysłaliśmy nowy kod."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(new MessageResponse(
                "Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła na podany adres."));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(authService.me(currentUser.getId()));
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
                                                            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Hasło zostało zmienione"));
    }
}
