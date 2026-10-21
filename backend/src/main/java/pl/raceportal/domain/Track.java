package pl.raceportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Katalog toru / miejsca wydarzeń motorsportowych w Polsce.
 * <p>
 * Rola: słownik lokalizacji (presety formularza organizatora, filtry mapy).
 * Wydarzenia nadal trzymają {@code track}/{@code city} jako stringi — ten katalog
 * jest źródłem podpowiedzi, nie FK.
 * </p>
 */
@Entity
@Table(name = "tracks", indexes = {
        @Index(name = "idx_tracks_voivodeship", columnList = "voivodeship"),
        @Index(name = "idx_tracks_city", columnList = "city"),
        @Index(name = "idx_tracks_kind", columnList = "kind")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_tracks_name", columnNames = "name")
})
public class Track {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 60)
    private String voivodeship;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    /** CIRCUIT / AUTODROM / KARTING / DRIFT / RALLY / AIRFIELD / SPEEDWAY / EXPO / OTHER */
    @Column(nullable = false, length = 30)
    private String kind = "OTHER";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
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

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
