package com.example.backend_raceportal.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "test")
public class TestEntity {
    @Id
    private int id;
    private String text;
}

