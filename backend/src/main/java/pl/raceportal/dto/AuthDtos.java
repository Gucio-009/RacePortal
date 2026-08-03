package pl.raceportal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

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

    public record RegisterOrganizerRequest(
            @NotBlank @Size(min = 2, max = 40) String username,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank @Size(min = 2, max = 120) String company,
            @Size(max = 2000) String message
    ) {
    }

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
