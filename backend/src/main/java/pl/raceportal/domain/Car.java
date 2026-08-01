package pl.raceportal.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cars", indexes = @Index(columnList = "user_id"))
public class Car {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "user_id", nullable = false, length = 36)
  private String userId;

  @Column(nullable = false, length = 100)
  private String make;

  @Column(nullable = false, length = 100)
  private String model;

  private Integer year;

  @Column(name = "class_name", length = 100)
  private String className;

  @Column(length = 32)
  private String plate;

  @Column(name = "image_url", length = 512)
  private String imageUrl;

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
  public String getMake() { return make; }
  public void setMake(String make) { this.make = make; }
  public String getModel() { return model; }
  public void setModel(String model) { this.model = model; }
  public Integer getYear() { return year; }
  public void setYear(Integer year) { this.year = year; }
  public String getClassName() { return className; }
  public void setClassName(String className) { this.className = className; }
  public String getPlate() { return plate; }
  public void setPlate(String plate) { this.plate = plate; }
  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
