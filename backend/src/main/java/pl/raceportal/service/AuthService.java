package pl.raceportal.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.JwtService;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.AuthDtos;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final JwtService jwtService;
  private final MailService mail;

  public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwtService, MailService mail) {
    this.users = users;
    this.encoder = encoder;
    this.jwtService = jwtService;
    this.mail = mail;
  }

  public AuthDtos.UserResponse toUserResponse(User user) {
    String year = DateTimeFormatter.ofPattern("yyyy")
        .withZone(ZoneOffset.UTC)
        .format(user.getCreatedAt());
    return new AuthDtos.UserResponse(
        user.getId(),
        user.getEmail(),
        user.getUsername(),
        user.getRole().name(),
        user.getAvatar(),
        year);
  }

  @Transactional
  public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
    String email = req.email().trim().toLowerCase();
    if (users.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "Konto z tym emailem już istnieje");
    }
    User user = new User();
    user.setEmail(email);
    user.setUsername(req.username().trim());
    user.setPasswordHash(encoder.encode(req.password()));
    user.setRole(Role.USER);
    user.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + URLEncoder.encode(email, StandardCharsets.UTF_8));
    users.save(user);
    mail.send(user.getEmail(), "Witaj w RACEPORTAL", "Cześć " + user.getUsername() + ", konto zostało utworzone.");
    return new AuthDtos.AuthResponse(jwtService.generateToken(user), toUserResponse(user));
  }

  public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
    User user = users.findByEmailIgnoreCase(req.email().trim().toLowerCase())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy email lub hasło"));
    if (!encoder.matches(req.password(), user.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy email lub hasło");
    }
    return new AuthDtos.AuthResponse(jwtService.generateToken(user), toUserResponse(user));
  }

  public AuthDtos.UserResponse me(String userId) {
    User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));
    return toUserResponse(user);
  }

  @Transactional
  public AuthDtos.UserResponse patchMe(String userId, AuthDtos.PatchMeRequest req) {
    User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));
    if (req.username() != null) user.setUsername(req.username().trim());
    if (req.email() != null) {
      String email = req.email().trim().toLowerCase();
      if (!email.equalsIgnoreCase(user.getEmail()) && users.existsByEmailIgnoreCase(email)) {
        throw new ApiException(HttpStatus.CONFLICT, "Ten email jest już zajęty");
      }
      if (!email.equalsIgnoreCase(user.getEmail())) {
        user.setEmail(email);
        mail.send(email, "Zmiana adresu e-mail — RACEPORTAL", "Twój e-mail zmieniono na " + email);
      }
    }
    if (req.avatar() != null) {
      user.setAvatar(req.avatar().isBlank() ? null : req.avatar().trim());
    }
    users.save(user);
    return toUserResponse(user);
  }

  @Transactional
  public AuthDtos.MessageResponse changePassword(String userId, AuthDtos.ChangePasswordRequest req) {
    User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));
    if (!encoder.matches(req.currentPassword(), user.getPasswordHash())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Obecne hasło jest nieprawidłowe");
    }
    if (req.currentPassword().equals(req.newPassword())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Nowe hasło musi być inne niż obecne");
    }
    user.setPasswordHash(encoder.encode(req.newPassword()));
    users.save(user);
    mail.send(user.getEmail(), "Hasło zmienione — RACEPORTAL", "Hasło do konta zostało zmienione.");
    return new AuthDtos.MessageResponse("Hasło zostało zmienione");
  }

  public AuthDtos.MessageResponse forgotPassword(AuthDtos.ForgotPasswordRequest req) {
    users.findByEmailIgnoreCase(req.email().trim().toLowerCase()).ifPresent(user ->
        mail.send(user.getEmail(), "Reset hasła RACEPORTAL",
            "Otrzymaliśmy prośbę o reset hasła dla " + user.getUsername() + "."));
    return new AuthDtos.MessageResponse(
        "Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła na podany adres.");
  }
}
