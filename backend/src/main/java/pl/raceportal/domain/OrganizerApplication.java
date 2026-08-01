package pl.raceportal.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organizer_applications", indexes = {
    @Index(columnList = "status"),
    @Index(columnList = "user_id")
})
public class OrganizerApplication {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "user_id", nullable = false, length = 36)
  private String userId;

  @Column(nullable = false, length = 255)
  private String company;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private RegistrationStatus status = RegistrationStatus.PENDING;

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
  public String getCompany() { return company; }
  public void setCompany(String company) { this.company = company; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public RegistrationStatus getStatus() { return status; }
  public void setStatus(RegistrationStatus status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
