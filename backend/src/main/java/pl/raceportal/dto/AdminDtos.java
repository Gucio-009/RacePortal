package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import pl.raceportal.dto.RegistrationDtos.UserRef;

/**
 * DTO panelu administratora — statystyki, użytkownicy, statusy wydarzeń i wniosków.
 * <p>
 * Rola w architekturze: kontrakt {@code AdminController} (RBAC ADMIN).
 * {@code OrganizerApplicationResponse} współdzielone też z wnioskiem z {@code OrganizerController}.
 * Technologie: Bean Validation, Jackson.
 * </p>
 * Pomysł (alt): OpenAPI; osobny admin BFF.
 */
public final class AdminDtos {

    private AdminDtos() {
    }

    /** Liczniki dashboardu admina. */
    public record StatsResponse(
            long users,
            long events,
            long pendingEvents,
            long registrations,
            long pendingApps
    ) {
    }

    /** Wiersz listy użytkowników w panelu. */
    public record UserAdminResponse(
            String id,
            String email,
            String username,
            String role,
            String avatar,
            String createdAt
    ) {
    }

    /** Zmiana roli — wartość z enum {@code Role}. */
    public record RoleUpdateRequest(
            @NotBlank String role
    ) {
    }

    /** Moderacja statusu wydarzenia ({@code EventStatus}). */
    public record EventStatusUpdateRequest(
            @NotBlank String status
    ) {
    }

    /** Widok wniosku o rolę organizatora. */
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

    /** Decyzja APPROVED/REJECTED dla wniosku organizatora. */
    public record OrganizerApplicationStatusUpdateRequest(
            @NotBlank String status
    ) {
    }
}
