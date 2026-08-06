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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Encja zgłoszenia zawodnika na wydarzenie.
 * <p>
 * Rola w architekturze: łączy {@link User}, {@link Event} i opcjonalnie {@link Car};
 * unikalność (user + event) gwarantuje jedno aktywne zgłoszenie na imprezę.
 * Logika statusów i płatności żyje w {@code RegistrationService} / {@code OrganizerService}.
 * Technologie: JPA/Hibernate, MySQL; Spring Mail (powiadomienia o zmianie statusu).
 * </p>
 * Reguły płatności: po ACCEPTED ustawiane jest {@code paymentDueAt};
 * {@code paymentProofUrl} to dowód przelewu; po weryfikacji status → CONFIRMED.
 * <p>
 * Pomysł (alt): bramka płatności (Stripe/PayU) zamiast ręcznego dowodu przelewu;
 * outbox + kolejka do maili.
 * </p>
 */
@Entity
@Table(name = "registrations",
        uniqueConstraints = @UniqueConstraint(name = "uq_registration_user_event", columnNames = {"user_id", "event_id"}),
        indexes = {
                @Index(name = "idx_registrations_event_status", columnList = "event_id,status"),
                @Index(name = "idx_registrations_user_id", columnList = "user_id")
        })
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Zawodnik składający zgłoszenie. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Wydarzenie docelowe. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** Pojazd z garażu — może być wymagany przy tworzeniu zgłoszenia. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id")
    private Car car;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    /** Notatka zawodnika do organizatora. */
    @Column(length = 500)
    private String note;

    /** Komentarz organizatora (np. powód odrzucenia / uwagi). */
    @Column(name = "organizer_comment", length = 500)
    private String organizerComment;

    /** URL dowodu płatności (przelew) — wymagany przy wydarzeniach płatnych. */
    @Column(name = "payment_proof_url", length = 500)
    private String paymentProofUrl;

    /** Termin dostarczenia / weryfikacji płatności (po ACCEPTED). */
    @Column(name = "payment_due_at")
    private Instant paymentDueAt;

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

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public Car getCar() {
        return car;
    }

    public void setCar(Car car) {
        this.car = car;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getOrganizerComment() {
        return organizerComment;
    }

    public void setOrganizerComment(String organizerComment) {
        this.organizerComment = organizerComment;
    }

    public String getPaymentProofUrl() {
        return paymentProofUrl;
    }

    public void setPaymentProofUrl(String paymentProofUrl) {
        this.paymentProofUrl = paymentProofUrl;
    }

    public Instant getPaymentDueAt() {
        return paymentDueAt;
    }

    public void setPaymentDueAt(Instant paymentDueAt) {
        this.paymentDueAt = paymentDueAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
