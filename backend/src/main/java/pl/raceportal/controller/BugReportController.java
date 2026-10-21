package pl.raceportal.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.BugReportDtos.BugReportCreatedResponse;
import pl.raceportal.dto.BugReportDtos.BugReportResponse;
import pl.raceportal.dto.BugReportDtos.CreateBugReportRequest;
import pl.raceportal.dto.BugReportDtos.UpdateBugReportStatusRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.BugReportService;

import java.util.List;

/**
 * Zgłoszenia błędów. Wysłanie jest publiczne; lista tylko dla admina.
 * Zalogowany użytkownik jest dopinany z JWT, jeśli nagłówek przyszedł z tokenem.
 */
@RestController
@RequestMapping("/api/bug-reports")
public class BugReportController {

    private final BugReportService bugReportService;

    public BugReportController(BugReportService bugReportService) {
        this.bugReportService = bugReportService;
    }

    @PostMapping
    public ResponseEntity<BugReportCreatedResponse> create(@Valid @RequestBody CreateBugReportRequest request,
                                                            @AuthenticationPrincipal UserPrincipal currentUser,
                                                            HttpServletRequest httpRequest) {
        bugReportService.submit(request, currentUser, clientKey(httpRequest, currentUser));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BugReportCreatedResponse("Dziękujemy, zgłoszenie zapisane."));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BugReportResponse>> list() {
        return ResponseEntity.ok(bugReportService.list());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BugReportResponse> updateStatus(@PathVariable String id,
                                                           @Valid @RequestBody UpdateBugReportStatusRequest request) {
        return ResponseEntity.ok(bugReportService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        bugReportService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private String clientKey(HttpServletRequest request, UserPrincipal currentUser) {
        if (currentUser != null) {
            return "user:" + currentUser.getId();
        }
        String cloudflare = request.getHeader("CF-Connecting-IP");
        if (cloudflare != null && !cloudflare.isBlank()) {
            return "ip:" + cloudflare.trim();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }
}
