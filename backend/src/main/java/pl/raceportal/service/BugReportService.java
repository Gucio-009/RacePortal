package pl.raceportal.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.BugReport;
import pl.raceportal.domain.BugReportStatus;
import pl.raceportal.domain.User;
import pl.raceportal.dto.BugReportDtos.BugReportResponse;
import pl.raceportal.dto.BugReportDtos.CreateBugReportRequest;
import pl.raceportal.repository.BugReportRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.AttemptRateLimiter;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class BugReportService {

    private static final int MAX_REPORTS = 8;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final BugReportRepository bugReportRepository;
    private final UserRepository userRepository;
    private final AttemptRateLimiter attemptRateLimiter;

    public BugReportService(BugReportRepository bugReportRepository,
                            UserRepository userRepository,
                            AttemptRateLimiter attemptRateLimiter) {
        this.bugReportRepository = bugReportRepository;
        this.userRepository = userRepository;
        this.attemptRateLimiter = attemptRateLimiter;
    }

    @Transactional
    public void submit(CreateBugReportRequest request, UserPrincipal principal, String clientKey) {
        attemptRateLimiter.check("bug:" + clientKey, MAX_REPORTS, WINDOW);

        BugReport report = new BugReport();
        report.setMessage(request.message().trim());
        report.setPageUrl(cleanPage(request.pageUrl()));
        report.setStatus(BugReportStatus.OPEN);
        if (principal != null) {
            User user = userRepository.findById(principal.getId()).orElse(null);
            report.setUser(user);
        } else {
            report.setContactEmail(cleanEmail(request.email()));
        }
        bugReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<BugReportResponse> list() {
        return bugReportRepository.findRecent(PageRequest.of(0, 200)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BugReportResponse updateStatus(String id, BugReportStatus status) {
        BugReport report = bugReportRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono zgłoszenia"));
        report.setStatus(status);
        return toResponse(bugReportRepository.save(report));
    }

    @Transactional
    public void delete(String id) {
        if (!bugReportRepository.existsById(id)) {
            throw ApiException.notFound("Nie znaleziono zgłoszenia");
        }
        bugReportRepository.deleteById(id);
    }

    private BugReportResponse toResponse(BugReport report) {
        User user = report.getUser();
        BugReportStatus status = report.getStatus() == null ? BugReportStatus.OPEN : report.getStatus();
        return new BugReportResponse(
                report.getId(),
                report.getMessage(),
                report.getPageUrl(),
                report.getCreatedAt(),
                user != null ? user.getUsername() : null,
                user != null ? user.getEmail() : null,
                report.getContactEmail(),
                status);
    }

    private String cleanPage(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.trim();
        if (value.isEmpty() || !value.startsWith("/") || value.startsWith("//")) {
            return null;
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private String cleanEmail(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String email = raw.trim().toLowerCase();
        if (email.length() > 160 || !EMAIL.matcher(email).matches()) {
            throw ApiException.badRequest("Podaj poprawny adres e-mail albo zostaw to pole puste.");
        }
        return email;
    }
}
