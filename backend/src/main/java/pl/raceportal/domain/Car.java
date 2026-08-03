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

@Entity
@Table(name = "cars", indexes = {
        @Index(name = "idx_cars_user_id", columnList = "user_id")
})
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String make;

    @Column(nullable = false, length = 60)
    private String model;

    private Integer year;

    @Column(name = "class_name", length = 60)
    private String className;

    @Column(length = 20)
    private String plate;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "drive_type", length = 10)
    private String driveType;

    @Column(name = "power_hp")
    private Integer powerHp;

    @Column(name = "engine_cc")
    private Integer engineCc;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(nullable = false)
    private boolean registered = true;

    @Column(name = "registration_type", length = 20)
    private String registrationType;

    @Column(name = "kss_number", length = 40)
    private String kssNumber;

    @Column(name = "has_roll_cage", nullable = false)
    private boolean hasRollCage = false;

    @Column(name = "has_oc", nullable = false)
    private boolean hasOc = false;

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
