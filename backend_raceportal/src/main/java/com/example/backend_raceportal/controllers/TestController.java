package com.example.backend_raceportal.controllers;

import com.example.backend_raceportal.dto.TestRequest;
import com.example.backend_raceportal.dto.TestResponse;
import com.example.backend_raceportal.services.TestService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {
    private TestService testService;

    TestController(TestService testService) {
        this.testService = testService;
    }

    @PostMapping("/check")
    public TestResponse check(@RequestBody TestRequest testRequest) {
        return testService.makeTest(testRequest);
    }
}
