package pl.raceportal.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "events", indexes = {
    @Index(columnList = "status,date"),
    @Index(columnList = "category"),
    @Index(columnList = "city"),
    @Index(columnList = "organizer_id")
})
public class Event {

  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false, length = 100)
  private String category;

  @Column(nullable = false)
  private LocalDate date;

  @Column(nullable = false, length = 16)
  private String time;

  @Column(nullable = false, length = 255)
  private String track;

  @Column(nullable = false, length = 100)
  private String city;

  @Column(nullable = false, length = 100)
  private String voivodeship;

  @Column(name = "image_url", length = 512)
  private String imageUrl;

  private Double lat;
  private Double lng;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private EventStatus status = EventStatus.PENDING;

  @Column(name = "organizer_id", length = 36)
  private String organizerId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @PrePersist
  void prePersist() {
    if (id == null) id = java.util.UUID.randomUUID().toString();
    createdAt = Instant.now();
    updatedAt = createdAt;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
  public String getTime() { return time; }
  public void setTime(String time) { this.time = time; }
  public String getTrack() { return track; }
  public void setTrack(String track) { this.track = track; }
  public String getCity() { return city; }
  public void setCity(String city) { this.city = city; }
  public String getVoivodeship() { return voivodeship; }
  public void setVoivodeship(String voivodeship) { this.voivodeship = voivodeship; }
  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public Double getLat() { return lat; }
  public void setLat(Double lat) { this.lat = lat; }
  public Double getLng() { return lng; }
  public void setLng(Double lng) { this.lng = lng; }
  public EventStatus getStatus() { return status; }
  public void setStatus(EventStatus status) { this.status = status; }
  public String getOrganizerId() { return organizerId; }
  public void setOrganizerId(String organizerId) { this.organizerId = organizerId; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
