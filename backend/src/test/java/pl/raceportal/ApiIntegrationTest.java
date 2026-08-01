package pl.raceportal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ApiIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("raceportal")
            .withUsername("raceportal")
            .withPassword("raceportal");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeAll
    static void beforeAll() {
        MYSQL.start();
    }

    private String login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginPayload(email, password));
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(response);
        return node.get("token").asText();
    }

    @Test
    void health_returnsOkWithDatabaseUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ok")))
                .andExpect(jsonPath("$.service", is("raceportal-api")))
                .andExpect(jsonPath("$.db", is("up")));
    }

    @Test
    void login_worksForAllThreeSeededRoles() throws Exception {
        String adminToken = login("admin@raceportal.pl", "admin123");
        String orgToken = login("org@raceportal.pl", "org123");
        String userToken = login("test@wp.pl", "test123");

        assertNotBlank(adminToken);
        assertNotBlank(orgToken);
        assertNotBlank(userToken);
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(new LoginPayload("test@wp.pl", "wrong-password"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void me_withValidToken_returns200() throws Exception {
        String token = login("test@wp.pl", "test123");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("test@wp.pl")))
                .andExpect(jsonPath("$.role", is("USER")));
    }

    @Test
    void register_withExistingEmail_returns409() throws Exception {
        String body = objectMapper.writeValueAsString(new RegisterPayload("Another", "test@wp.pl", "password123"));
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void register_withInvalidPayload_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(new RegisterPayload("A", "not-an-email", "123"));
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details", notNullValue()));
    }

    @Test
    void events_list_returnsSeededApprovedEvents() throws Exception {
        mockMvc.perform(get("/api/events").param("page", "1").param("limit", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(1)));
    }

    @Test
    void garage_list_returnsSeededCarsForDriver() throws Exception {
        String token = login("test@wp.pl", "test123");
        mockMvc.perform(get("/api/garage").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2)));
    }

    @Test
    void admin_endpoint_forbiddenForRegularUser() throws Exception {
        String token = login("test@wp.pl", "test123");
        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void admin_endpoint_allowedForAdmin() throws Exception {
        String token = login("admin@raceportal.pl", "admin123");
        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", greaterThanOrEqualTo(1)));
    }

    private static void assertNotBlank(String value) {
        if (value == null || value.isBlank()) {
            throw new AssertionError("Expected non-blank value");
        }
    }

    private record LoginPayload(String email, String password) {
    }

    private record RegisterPayload(String username, String email, String password) {
    }
}
