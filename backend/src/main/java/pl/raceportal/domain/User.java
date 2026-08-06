package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Encja użytkownika portalu (kierowca, organizator lub admin).
 * <p>
 * Rola w architekturze: rdzeń tożsamości — powiązana z garażem ({@link Car}),
 * zgłoszeniami ({@link Registration}), wydarzeniami (jako organizator) oraz JWT
 * ({@code UserPrincipal}). Persystencja: JPA/Hibernate → tabela {@code users} (MySQL).
 * </p>
 * Reguły biznesowe: email unikalny; hasło przechowywane jako hash (BCrypt);
 * weryfikacja e-mail kodem jednorazowym; prawa jazdy B / licencja PZM wymagane
 * przy zgłoszeniach na wydarzenia z flagami {@code require*}.
 * <p>
 * Pomysł (alt): PostgreSQL zamiast MySQL; Keycloak jako IdP zamiast lokalnego User;
 * MapStruct do mapowania User → DTO.
 * </p>
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_email", columnList = "email")
})
public class User {

    /** Identyfikator UUID generowany przez JPA. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Login / kontakt — unikalny w systemie. */
    @Column(nullable = false, unique = true, length = 190)
    private String email;

    /** Wyświetlana nazwa użytkownika (niekoniecznie unikalna). */
    @Column(nullable = false, length = 80)
    private String username;

    /** Hash BCrypt hasła; dla kont Google OAuth może być placeholder. */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    /** Rola RBAC — domyślnie USER. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    /** URL avatara (opcjonalnie z Google). */
    @Column(length = 500)
    private String avatar;

    @Column(name = "first_name", length = 80)
    private String firstName;

    @Column(name = "last_name", length = 80)
    private String lastName;

    @Column(length = 30)
    private String phone;

    /** Czy użytkownik deklaruje prawo jazdy kat. B (wymóg wydarzenia). */
    @Column(name = "has_driving_license_b", nullable = false)
    private boolean hasDrivingLicenseB = false;

    /** Numer licencji PZM — wymagany gdy wydarzenie ma {@code requirePzmLicense}. */
    @Column(name = "pzm_license", length = 40)
    private String pzmLicense;

    /** Flaga weryfikacji adresu e-mail (po rejestracji lokalnej). */
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = true;

    /** Jednorazowy kod weryfikacyjny wysyłany mailem. */
    @Column(name = "email_verification_code", length = 10)
    private String emailVerificationCode;

    /** Termin ważności kodu weryfikacyjnego. */
    @Column(name = "email_verification_expires")
    private Instant emailVerificationExpires;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Ustawia znaczniki czasu przy pierwszym zapisie. */
    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** Odświeża {@code updatedAt} przy każdej aktualizacji encji. */
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isHasDrivingLicenseB() {
        return hasDrivingLicenseB;
    }

    public void setHasDrivingLicenseB(boolean hasDrivingLicenseB) {
        this.hasDrivingLicenseB = hasDrivingLicenseB;
    }

    public String getPzmLicense() {
        return pzmLicense;
    }

    public void setPzmLicense(String pzmLicense) {
        this.pzmLicense = pzmLicense;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getEmailVerificationCode() {
        return emailVerificationCode;
    }

    public void setEmailVerificationCode(String emailVerificationCode) {
        this.emailVerificationCode = emailVerificationCode;
    }

    public Instant getEmailVerificationExpires() {
        return emailVerificationExpires;
    }

    public void setEmailVerificationExpires(Instant emailVerificationExpires) {
        this.emailVerificationExpires = emailVerificationExpires;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
