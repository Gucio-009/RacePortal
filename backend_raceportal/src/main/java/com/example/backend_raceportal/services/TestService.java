package com.example.backend_raceportal.services;

import com.example.backend_raceportal.dto.TestRequest;
import com.example.backend_raceportal.dto.TestResponse;
import com.example.backend_raceportal.entities.TestEntity;
import com.example.backend_raceportal.repositories.TestRepository;
import org.springframework.stereotype.Service;

@Service
public class TestService {
    private TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    public TestResponse makeTest(TestRequest testRequest) {
        TestEntity test = testRepository.findById(testRequest.id()).orElse(null);

        if (test == null) {
            return new TestResponse("test doesn't exist");
        }

        return new TestResponse(test.getText());
    }
}
