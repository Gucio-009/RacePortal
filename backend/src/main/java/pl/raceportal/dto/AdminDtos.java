package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import pl.raceportal.dto.RegistrationDtos.UserRef;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record StatsResponse(
            long users,
            long events,
            long pendingEvents,
            long registrations,
            long pendingApps
    ) {
    }

    public record UserAdminResponse(
            String id,
            String email,
            String username,
            String role,
            String avatar,
            String createdAt
    ) {
    }

    public record RoleUpdateRequest(
            @NotBlank String role
    ) {
    }

    public record EventStatusUpdateRequest(
            @NotBlank String status
    ) {
    }

    public record OrganizerApplicationResponse(
            String id,
            String userId,
            String company,
            String message,
            String status,
            String createdAt,
            String updatedAt,
            UserRef user
    ) {
    }

    public record OrganizerApplicationStatusUpdateRequest(
            @NotBlank String status
    ) {
    }
}
