package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Zgłoszenie błędu od znajomego recenzującego portal.
 * Konto jest opcjonalne — formularz działa też bez logowania.
 */
@Entity
@Table(name = "bug_reports", indexes = {
        @Index(name = "idx_bug_reports_created", columnList = "created_at")
})
public class BugReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** E-mail podany przez gościa, gdy nie ma konta. */
    @Column(name = "contact_email", length = 160)
    private String contactEmail;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Ścieżka strony, z której wysłano zgłoszenie. */
    @Column(name = "page_url", length = 500)
    private String pageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
