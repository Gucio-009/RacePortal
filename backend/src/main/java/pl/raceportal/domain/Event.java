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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_events_status_date", columnList = "status,date"),
        @Index(name = "idx_events_category", columnList = "category"),
        @Index(name = "idx_events_city", columnList = "city"),
        @Index(name = "idx_events_name", columnList = "name"),
        @Index(name = "idx_events_organizer_id", columnList = "organizer_id")
})
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 10)
    private String time;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "end_time", length = 10)
    private String endTime;

    @Column(nullable = false, length = 120)
    private String track;

    @Column(length = 120)
    private String street;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 80)
    private String voivodeship;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    private Double lat;

    private Double lng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status = EventStatus.PENDING;

    @Column(nullable = false)
    private boolean paid = false;

    @Column(name = "entry_fee", precision = 10, scale = 2)
    private BigDecimal entryFee;

    @Column(name = "bank_account", length = 60)
    private String bankAccount;

    @Column(name = "payment_deadline_hours", nullable = false)
    private Integer paymentDeadlineHours = 72;

    @Column(name = "free_cancel_days", nullable = false)
    private Integer freeCancelDays = 7;

    @Column(name = "accept_registrations", nullable = false)
    private boolean acceptRegistrations = true;

    @Column(name = "spectator_fee", precision = 10, scale = 2)
    private BigDecimal spectatorFee;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Column(name = "require_driving_license", nullable = false)
    private boolean requireDrivingLicense = false;

    @Column(name = "require_pzm_license", nullable = false)
    private boolean requirePzmLicense = false;

    @Column(name = "require_oc", nullable = false)
    private boolean requireOc = false;

    @Column(name = "require_pt", nullable = false)
    private boolean requirePt = false;

    @Column(name = "require_cage", nullable = false)
    private boolean requireCage = false;

    @Column(name = "require_registered", nullable = false)
    private boolean requireRegistered = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private User organizer;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getTrack() {
        return track;
    }

    public void setTrack(String track) {
        this.track = track;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getVoivodeship() {
        return voivodeship;
    }

    public void setVoivodeship(String voivodeship) {
        this.voivodeship = voivodeship;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public User getOrganizer() {
        return organizer;
    }

    public void setOrganizer(User organizer) {
        this.organizer = organizer;
    }

    public boolean isPaid() {
        return paid;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    public BigDecimal getEntryFee() {
        return entryFee;
    }

    public void setEntryFee(BigDecimal entryFee) {
        this.entryFee = entryFee;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public Integer getPaymentDeadlineHours() {
        return paymentDeadlineHours;
    }

    public void setPaymentDeadlineHours(Integer paymentDeadlineHours) {
        this.paymentDeadlineHours = paymentDeadlineHours;
    }

    public Integer getFreeCancelDays() {
        return freeCancelDays;
    }

    public void setFreeCancelDays(Integer freeCancelDays) {
        this.freeCancelDays = freeCancelDays;
    }

    public boolean isAcceptRegistrations() {
        return acceptRegistrations;
    }

    public void setAcceptRegistrations(boolean acceptRegistrations) {
        this.acceptRegistrations = acceptRegistrations;
    }

    public BigDecimal getSpectatorFee() {
        return spectatorFee;
    }

    public void setSpectatorFee(BigDecimal spectatorFee) {
        this.spectatorFee = spectatorFee;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public boolean isRequireDrivingLicense() {
        return requireDrivingLicense;
    }

    public void setRequireDrivingLicense(boolean requireDrivingLicense) {
        this.requireDrivingLicense = requireDrivingLicense;
    }

    public boolean isRequirePzmLicense() {
        return requirePzmLicense;
    }

    public void setRequirePzmLicense(boolean requirePzmLicense) {
        this.requirePzmLicense = requirePzmLicense;
    }

    public boolean isRequireOc() {
        return requireOc;
    }

    public void setRequireOc(boolean requireOc) {
        this.requireOc = requireOc;
    }

    public boolean isRequirePt() {
        return requirePt;
    }

    public void setRequirePt(boolean requirePt) {
        this.requirePt = requirePt;
    }

    public boolean isRequireCage() {
        return requireCage;
    }

    public void setRequireCage(boolean requireCage) {
        this.requireCage = requireCage;
    }

    public boolean isRequireRegistered() {
        return requireRegistered;
    }

    public void setRequireRegistered(boolean requireRegistered) {
        this.requireRegistered = requireRegistered;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
