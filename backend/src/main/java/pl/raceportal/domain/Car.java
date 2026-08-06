package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Lob;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Encja samochodu w garażu użytkownika.
 * <p>
 * Rola w architekturze: profil pojazdu powiązany z {@link User}; wybierany przy
 * zgłoszeniu na wydarzenie ({@link Registration#getCar()}). Parametry techniczne
 * (moc, napęd, klatka, OC/PT) służą walidacji wymogów wydarzenia i dopasowaniu kategorii
 * ({@code CategoryMatcher}).
 * Technologie: JPA/Hibernate, MySQL.
 * </p>
 * Reguły: auto należy do jednego użytkownika; flagi bezpieczeństwa/ubezpieczeń
 * muszą spełniać {@code Event.require*} przy rejestracji.
 * <p>
 * Pomysł (alt): osobny mikroserwis „garage”; MapStruct dla Car ↔ GarageDto.
 * </p>
 */
@Entity
@Table(name = "cars", indexes = {
        @Index(name = "idx_cars_user_id", columnList = "user_id")
})
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Właściciel pojazdu. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String make;

    @Column(nullable = false, length = 60)
    private String model;

    private Integer year;

    /** Klasa / kategoria pojazdu (np. Street, Pro) — input do CategoryMatcher. */
    @Column(name = "class_name", length = 60)
    private String className;

    @Column(length = 20)
    private String plate;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Typ napędu (np. RWD, AWD, FWD). */
    @Column(name = "drive_type", length = 10)
    private String driveType;

    @Column(name = "power_hp")
    private Integer powerHp;

    @Column(name = "engine_cc")
    private Integer engineCc;

    @Column(name = "weight_kg")
    private Integer weightKg;

    /** Czy pojazd jest zarejestrowany — wymóg {@code Event.requireRegistered}. */
    @Column(nullable = false)
    private boolean registered = true;

    /** Rodzaj rejestracji (np. zwykła, zabytkowa, wyścigowa). */
    @Column(name = "registration_type", length = 20)
    private String registrationType;

    /** Numer KSS (książka sportowa samochodu) — jeśli dotyczy. */
    @Column(name = "kss_number", length = 40)
    private String kssNumber;

    /** Klatka bezpieczeństwa — wymóg {@code Event.requireCage}. */
    @Column(name = "has_roll_cage", nullable = false)
    private boolean hasRollCage = false;

    /** Polisa OC — wymóg {@code Event.requireOc}. */
    @Column(name = "has_oc", nullable = false)
    private boolean hasOc = false;

    /** Przegląd techniczny — wymóg {@code Event.requirePt}. */
    @Column(name = "has_pt", nullable = false)
    private boolean hasPt = false;

    @Column(name = "social_url", length = 500)
    private String socialUrl;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String modifications;

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

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getPlate() {
        return plate;
    }

    public void setPlate(String plate) {
        this.plate = plate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDriveType() {
        return driveType;
    }

    public void setDriveType(String driveType) {
        this.driveType = driveType;
    }

    public Integer getPowerHp() {
        return powerHp;
    }

    public void setPowerHp(Integer powerHp) {
        this.powerHp = powerHp;
    }

    public Integer getEngineCc() {
        return engineCc;
    }

    public void setEngineCc(Integer engineCc) {
        this.engineCc = engineCc;
    }

    public Integer getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Integer weightKg) {
        this.weightKg = weightKg;
    }

    public boolean isRegistered() {
        return registered;
    }

    public void setRegistered(boolean registered) {
        this.registered = registered;
    }

    public String getRegistrationType() {
        return registrationType;
    }

    public void setRegistrationType(String registrationType) {
        this.registrationType = registrationType;
    }

    public String getKssNumber() {
        return kssNumber;
    }

    public void setKssNumber(String kssNumber) {
        this.kssNumber = kssNumber;
    }

    public boolean isHasRollCage() {
        return hasRollCage;
    }

    public void setHasRollCage(boolean hasRollCage) {
        this.hasRollCage = hasRollCage;
    }

    public boolean isHasOc() {
        return hasOc;
    }

    public void setHasOc(boolean hasOc) {
        this.hasOc = hasOc;
    }

    public boolean isHasPt() {
        return hasPt;
    }

    public void setHasPt(boolean hasPt) {
        this.hasPt = hasPt;
    }

    public String getSocialUrl() {
        return socialUrl;
    }

    public void setSocialUrl(String socialUrl) {
        this.socialUrl = socialUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getModifications() {
        return modifications;
    }

    public void setModifications(String modifications) {
        this.modifications = modifications;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
