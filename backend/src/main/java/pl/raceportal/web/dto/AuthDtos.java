package pl.raceportal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
  private AuthDtos() {}

  public record RegisterRequest(
      @NotBlank @Size(min = 2, max = 40) String username,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6, max = 100) String password) {}

  public record LoginRequest(
      @NotBlank @Email String email,
      @NotBlank String password) {}

  public record ForgotPasswordRequest(@NotBlank @Email String email) {}

  public record PatchMeRequest(
      @Size(min = 2, max = 40) String username,
      @Email String email,
      String avatar) {}

  public record ChangePasswordRequest(
      @NotBlank String currentPassword,
      @NotBlank @Size(min = 6, max = 100) String newPassword) {}

  public record UserResponse(
      String id, String email, String username, String role, String avatar, String memberSince) {}

  public record AuthResponse(String token, UserResponse user) {}

  public record MessageResponse(String message) {}
}
