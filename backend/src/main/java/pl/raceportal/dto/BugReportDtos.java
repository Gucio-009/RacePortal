package pl.raceportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class BugReportDtos {

    private BugReportDtos() {
    }

    public record CreateBugReportRequest(
            @NotBlank @Size(min = 10, max = 2000) String message,
            @Size(max = 500) String pageUrl,
            @Size(max = 160) String email
    ) {
    }

    public record BugReportCreatedResponse(String message) {
    }

    public record BugReportResponse(
            String id,
            String message,
            String pageUrl,
            Instant createdAt,
            String username,
            String accountEmail,
            String contactEmail
    ) {
    }
}
