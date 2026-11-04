package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Klasa zawodów w ramach wydarzenia (np. „do 1600”, „Open AWD”).
 * Wszystkie kryteria filtrujące są opcjonalne ({@code null} = nieaktywne).
 */
@Entity
@Table(name = "event_classes", indexes = {
        @Index(name = "idx_event_classes_event_sort", columnList = "event_id,sort_order")
})
public class EventClass {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 80)
    private String name;

    /** Kolejność dopasowania — niższy = wcześniej (pierwszy match wygrywa). */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** Min. pojemność obliczeniowa (cm³); null = wyłączone. */
    @Column(name = "min_engine_cc")
    private Integer minEngineCc;

    /** Max. pojemność obliczeniowa (cm³); null = wyłączone. */
    @Column(name = "max_engine_cc")
    private Integer maxEngineCc;

    /** Mnożnik turbo (np. 1.7); null → 1.0 przy przeliczeniu. */
    @Column(name = "turbo_multiplier", precision = 6, scale = 3)
    private BigDecimal turboMultiplier;

    /** Mnożnik kompresora (np. 1.5); null → 1.0 przy przeliczeniu. */
    @Column(name = "supercharger_multiplier", precision = 6, scale = 3)
    private BigDecimal superchargerMultiplier;

    /** Dozwolone napędy CSV (FWD,RWD,AWD); null/puste = dowolny. */
    @Column(name = "allowed_drive_types", length = 40)
    private String allowedDriveTypes;

    /** true = wymagana klatka; null = kryterium wyłączone. */
    @Column(name = "require_cage")
    private Boolean requireCage;

    /** true = wymagane dopuszczenie do ruchu; null = wyłączone. */
    @Column(name = "require_registered")
    private Boolean requireRegistered;

    /** Dozwolone opony CSV; null/puste = dowolne. */
    @Column(name = "allowed_tire_types", length = 200)
    private String allowedTireTypes;

    /** Max KM/t; null = wyłączone. */
    @Column(name = "max_hp_per_tonne", precision = 8, scale = 2)
    private BigDecimal maxHpPerTonne;

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

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Integer getMinEngineCc() {
        return minEngineCc;
    }

    public void setMinEngineCc(Integer minEngineCc) {
        this.minEngineCc = minEngineCc;
    }

    public Integer getMaxEngineCc() {
        return maxEngineCc;
    }

    public void setMaxEngineCc(Integer maxEngineCc) {
        this.maxEngineCc = maxEngineCc;
    }

    public BigDecimal getTurboMultiplier() {
        return turboMultiplier;
    }

    public void setTurboMultiplier(BigDecimal turboMultiplier) {
        this.turboMultiplier = turboMultiplier;
    }

    public BigDecimal getSuperchargerMultiplier() {
        return superchargerMultiplier;
    }

    public void setSuperchargerMultiplier(BigDecimal superchargerMultiplier) {
        this.superchargerMultiplier = superchargerMultiplier;
    }

    public String getAllowedDriveTypes() {
        return allowedDriveTypes;
    }

    public void setAllowedDriveTypes(String allowedDriveTypes) {
        this.allowedDriveTypes = allowedDriveTypes;
    }

    public Boolean getRequireCage() {
        return requireCage;
    }

    public void setRequireCage(Boolean requireCage) {
        this.requireCage = requireCage;
    }

    public Boolean getRequireRegistered() {
        return requireRegistered;
    }

    public void setRequireRegistered(Boolean requireRegistered) {
        this.requireRegistered = requireRegistered;
    }

    public String getAllowedTireTypes() {
        return allowedTireTypes;
    }

    public void setAllowedTireTypes(String allowedTireTypes) {
        this.allowedTireTypes = allowedTireTypes;
    }

    public BigDecimal getMaxHpPerTonne() {
        return maxHpPerTonne;
    }

    public void setMaxHpPerTonne(BigDecimal maxHpPerTonne) {
        this.maxHpPerTonne = maxHpPerTonne;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
