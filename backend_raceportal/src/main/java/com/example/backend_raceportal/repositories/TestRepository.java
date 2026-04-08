package com.example.backend_raceportal.repositories;

import com.example.backend_raceportal.entities.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<TestEntity, Integer> {
}
