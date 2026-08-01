package pl.raceportal.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "registrations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "event_id"}),
    indexes = {
        @Index(columnList = "event_id,status"),
        @Index(columnList = "user_id")
    })
public class Registration {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "user_id", nullable = false, length = 36)
  private String userId;

  @Column(name = "event_id", nullable = false, length = 36)
  private String eventId;

  @Column(name = "car_id", length = 36)
  private String carId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private RegistrationStatus status = RegistrationStatus.PENDING;

  @Column(columnDefinition = "TEXT")
  private String note;

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
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getEventId() { return eventId; }
  public void setEventId(String eventId) { this.eventId = eventId; }
  public String getCarId() { return carId; }
  public void setCarId(String carId) { this.carId = carId; }
  public RegistrationStatus getStatus() { return status; }
  public void setStatus(RegistrationStatus status) { this.status = status; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
