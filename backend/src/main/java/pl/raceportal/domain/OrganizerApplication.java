package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Encja wniosku o nadanie roli organizatora.
 * <p>
 * Rola w architekturze: most między użytkownikiem USER a rolą ORGANIZER —
 * admin przegląda wnioski w {@code AdminService} i po APPROVED zmienia
 * {@link User#getRole()}. Technologie: JPA, MySQL, Spring Security (RBAC).
 * </p>
 * Reguły: jeden aktywny przepływ wniosku na użytkownika (logika w serwisie);
 * status niezależny od {@link RegistrationStatus}.
 * <p>
 * Pomysł (alt): Keycloak groups + admin console zamiast własnej tabeli wniosków.
 * </p>
 */
@Entity
@Table(name = "organizer_applications", indexes = {
        @Index(name = "idx_org_apps_status", columnList = "status"),
        @Index(name = "idx_org_apps_user_id", columnList = "user_id")
})
public class OrganizerApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Wnioskujący użytkownik (zwykle Role.USER). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Nazwa firmy / zespołu organizacyjnego. */
    @Column(nullable = false, length = 120)
    private String company;

    /** Uzasadnienie / opis doświadczenia. */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
