package pl.raceportal.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.security.AuthSupport;
import pl.raceportal.service.AuthService;
import pl.raceportal.web.dto.AuthDtos;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/register")
  public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
    return auth.register(req);
  }

  @PostMapping("/login")
  public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
    return auth.login(req);
  }

  @GetMapping("/me")
  public AuthDtos.UserResponse me() {
    return auth.me(AuthSupport.requireUser().getId());
  }

  @PatchMapping("/me")
  public AuthDtos.UserResponse patchMe(@Valid @RequestBody AuthDtos.PatchMeRequest req) {
    return auth.patchMe(AuthSupport.requireUser().getId(), req);
  }

  @PostMapping("/me/password")
  public AuthDtos.MessageResponse changePassword(@Valid @RequestBody AuthDtos.ChangePasswordRequest req) {
    return auth.changePassword(AuthSupport.requireUser().getId(), req);
  }

  @PostMapping("/forgot-password")
  public AuthDtos.MessageResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest req) {
    return auth.forgotPassword(req);
  }
}
