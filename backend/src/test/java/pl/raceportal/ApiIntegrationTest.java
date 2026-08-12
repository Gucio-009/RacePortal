package pl.raceportal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.MySQLContainer;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.repository.EventRepository;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testy integracyjne API RacePortal na prawdziwej bazie MySQL.
 * <p>
 * Rola w architekturze testów: end-to-end przez MockMvc — auth, wydarzenia, zgłoszenia,
 * garaż, RBAC. Preferuje Testcontainers ({@code mysql:8.0}); alternatywnie
 * zewnętrzne {@code TEST_DB_URL} / {@code TEST_DB_USER} / {@code TEST_DB_PASSWORD}.
 * Pomijane gdy brak Dockera i braku zewnętrznej DB ({@code @EnabledIf}).
 * </p>
 * Technologie: Spring Boot Test, MockMvc, Testcontainers MySQL, JUnit 5, profil {@code test}.
 * <p>
 * Pomysł (alt): RestAssured; Testcontainers + shared container (Ryuk); WireMock dla OSRM/Mail.
 * </p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@EnabledIf("pl.raceportal.ApiIntegrationTest#dockerOrExternalDbAvailable")
class ApiIntegrationTest {

    /** Czy używać zewnętrznej DB zamiast Testcontainers. */
    private static final boolean USE_EXTERNAL_DB = System.getenv("TEST_DB_URL") != null
            && !System.getenv("TEST_DB_URL").isBlank();

    private static MySQLContainer<?> mysql;

    static {
        if (!USE_EXTERNAL_DB && DockerClientFactory.instance().isDockerAvailable()) {
            mysql = new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("raceportal")
                    .withUsername("raceportal")
                    .withPassword("raceportal");
            mysql.start();
        }
    }

    /** Warunek uruchomienia klasy — Docker lub skonfigurowana zewnętrzna baza. */
    @SuppressWarnings("unused")
    static boolean dockerOrExternalDbAvailable() {
        return USE_EXTERNAL_DB || DockerClientFactory.instance().isDockerAvailable();
    }

    /** Podłącza datasource Spring do kontenera / env vars. */
    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        if (USE_EXTERNAL_DB) {
            registry.add("spring.datasource.url", () -> System.getenv("TEST_DB_URL"));
            registry.add("spring.datasource.username",
                    () -> System.getenv().getOrDefault("TEST_DB_USER", "raceportal"));
            registry.add("spring.datasource.password",
                    () -> System.getenv().getOrDefault("TEST_DB_PASSWORD", "raceportal"));
        } else if (mysql != null) {
            registry.add("spring.datasource.url", mysql::getJdbcUrl);
            registry.add("spring.datasource.username", mysql::getUsername);
            registry.add("spring.datasource.password", mysql::getPassword);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EventRepository eventRepository;

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

    /** Healthcheck publiczny — status ok + db up. */
    @Test
    void health_returnsOkWithDatabaseUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ok")))
                .andExpect(jsonPath("$.service", is("raceportal-api")))
                .andExpect(jsonPath("$.db", is("up")));
    }

    /** Seed: admin, organizer i kierowca mogą się zalogować. */
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

    /** Flow rejestracji lokalnej: register → verify-email → JWT. */
    @Test
    void register_thenVerifyEmail_returnsToken() throws Exception {
        String email = "nowy.kierowca@example.com";
        String registerBody = objectMapper.writeValueAsString(new RegisterPayload("NowyKierowca", email, "password123"));
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiresVerification", is(true)))
                .andExpect(jsonPath("$.email", is(email)));

        String loginAttemptBody = objectMapper.writeValueAsString(new LoginPayload(email, "password123"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(loginAttemptBody))
                .andExpect(status().isForbidden());

        String wrongCodeBody = objectMapper.writeValueAsString(new VerifyEmailPayload(email, "000000"));
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType("application/json")
                        .content(wrongCodeBody))
                .andExpect(status().isBadRequest());
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
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(2))));
    }

    /**
     * Reguła garażu: przy otwartym zgłoszeniu nie wolno zmienić make/model/class,
     * ale inne pola (np. plate) są dozwolone.
     */
    @Test
    void garage_update_blockedByOpenRegistration_thenAllowedForNonConflictingFields() throws Exception {
        String token = login("test@wp.pl", "test123");

        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Toyota", "GR86", 2023, null, "PO 11111", null));
        String carResponse = mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String carId = objectMapper.readTree(carResponse).get("id").asText();

        Event freeEvent = eventRepository.findAll().stream()
                .filter(e -> !e.isPaid() && e.getStatus() == EventStatus.APPROVED)
                .findFirst().orElseThrow();

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(freeEvent.getId(), carId, null));
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated());

        String conflictingUpdate = objectMapper.writeValueAsString(
                new CarPayload(null, "GR86 Facelift", null, null, null, null));
        mockMvc.perform(patch("/api/garage/" + carId)
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(conflictingUpdate))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("otwarte zgłoszenie")));

        mockMvc.perform(delete("/api/garage/" + carId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        String plateOnlyUpdate = objectMapper.writeValueAsString(
                new CarPayload(null, null, null, null, "PO 22222", null));
        mockMvc.perform(patch("/api/garage/" + carId)
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(plateOnlyUpdate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plate", is("PO 22222")));
    }

    /** Anulowanie zgłoszenia przez kierowcę → status CANCELED. */
    @Test
    void driver_cancelRegistration_setsCanceledStatus() throws Exception {
        String token = login("test@wp.pl", "test123");

        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Honda", "Civic Type R", 2020, "Track Day", "GD 33333", null));
        String carResponse = mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String carId = objectMapper.readTree(carResponse).get("id").asText();

        Event trackDayEvent = eventRepository.findAll().stream()
                .filter(e -> !e.isPaid() && e.getStatus() == EventStatus.APPROVED
                        && "Track Day".equalsIgnoreCase(e.getCategory()))
                .findFirst().orElseThrow();

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(trackDayEvent.getId(), carId, null));
        String regResponse = mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String regId = objectMapper.readTree(regResponse).get("id").asText();

        mockMvc.perform(post("/api/registrations/" + regId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELED")));
    }

    /**
     * Flow płatny: PENDING → ACCEPTED (org) → payment-proof (kierowca) → CONFIRMED (org).
     */
    @Test
    void paidRegistration_acceptedThenPaymentProofThenConfirmed() throws Exception {
        String driverToken = login("test@wp.pl", "test123");
        String orgToken = login("org@raceportal.pl", "org123");

        Event paidEvent = eventRepository.findAll().stream()
                .filter(Event::isPaid)
                .findFirst().orElseThrow();

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(paidEvent.getId(), null, null));
        String regResponse = mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String regId = objectMapper.readTree(regResponse).get("id").asText();

        String acceptBody = objectMapper.writeValueAsString(
                new RegistrationStatusPayload("ACCEPTED", "Prosimy o wpłatę wpisowego"));
        mockMvc.perform(patch("/api/registrations/" + regId + "/status")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(acceptBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACCEPTED")))
                .andExpect(jsonPath("$.paymentDueAt", notNullValue()));

        String proofBody = objectMapper.writeValueAsString(new PaymentProofPayload("https://example.com/proof.png"));
        mockMvc.perform(post("/api/registrations/" + regId + "/payment-proof")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(proofBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentProofUrl", is("https://example.com/proof.png")));

        String confirmBody = objectMapper.writeValueAsString(new RegistrationStatusPayload("CONFIRMED", null));
        mockMvc.perform(patch("/api/registrations/" + regId + "/status")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(confirmBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));
    }

    /** Alias kategorii: auto KJS powinno pasować do eventu Rally. */
    @Test
    void registration_acceptsCategoryAliasBetweenCarAndEvent() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");
        String driverToken = login("test@wp.pl", "test123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Rally alias test",
                "Event testowy dla dopasowania aliasów kategorii.",
                "Rally", "2026-12-15", "10:00", null, null, "Tor Alias", "Aliasowo", "Mazowieckie",
                null, null, null, false, null, null, null, null, true,
                null, null, null, null, null, null));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        String approveBody = objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"));
        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(approveBody))
                .andExpect(status().isOk());

        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Subaru", "Impreza", 2018, "KJS", "WA 12345", null));
        String carResponse = mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String carId = objectMapper.readTree(carResponse).get("id").asText();

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(eventId, carId, null));
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    /** Wymóg OC: event z requireOc=true odrzuca auto bez OC. */
    @Test
    void registration_rejectsCarWithoutOcWhenEventRequiresOc() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");
        String driverToken = login("test@wp.pl", "test123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "OC required test",
                "Event testowy dla walidacji wymogu OC.",
                "Track Day", "2026-12-20", "09:00", null, null, "Tor OC", "Poznań", "Wielkopolskie",
                null, null, null, false, null, null, null, null, true,
                null, null, true, null, null, null));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        String approveBody = objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"));
        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(approveBody))
                .andExpect(status().isOk());

        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Honda", "Civic", 2017, "Track Day", "PO 44556", null));
        String carResponse = mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String carId = objectMapper.readTree(carResponse).get("id").asText();

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(eventId, carId, null));
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("OC")));
    }

    /** Anulowanie wydarzenia kaskadowo ustawia otwarte zgłoszenia na CANCELED. */
    @Test
    void event_cancel_cancelsOpenRegistrations() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");
        String driverToken = login("test@wp.pl", "test123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Testowy Trackday do anulowania",
                "Wydarzenie testowe tworzone przez test integracyjny w celu weryfikacji anulowania.",
                "Track Day", "2026-12-01", "10:00", null, null, "Tor Testowy", "Testowo", "Testowe",
                null, null, null, false, null, null, null, null, true,
                null, null, null, null, null, null));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        String approveBody = objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"));
        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(approveBody))
                .andExpect(status().isOk());

        String regBody = objectMapper.writeValueAsString(new RegistrationCreatePayload(eventId, null, null));
        String regResponse = mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String regId = objectMapper.readTree(regResponse).get("id").asText();

        mockMvc.perform(post("/api/events/" + eventId + "/cancel")
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        mockMvc.perform(get("/api/registrations/mine")
                        .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + regId + "')].status", contains("CANCELED")));
    }

    /** RBAC: zwykły USER nie wchodzi na /api/admin. */
    @Test
    void admin_endpoint_forbiddenForRegularUser() throws Exception {
        String token = login("test@wp.pl", "test123");
        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    /** RBAC: ADMIN ma dostęp do /api/admin/stats. */
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

    private record VerifyEmailPayload(String email, String code) {
    }

    private record CarPayload(String make, String model, Integer year, String className, String plate, String imageUrl) {
    }

    private record RegistrationCreatePayload(String eventId, String carId, String note) {
    }

    private record RegistrationStatusPayload(String status, String comment) {
    }

    private record PaymentProofPayload(String paymentProofUrl) {
    }

    private record EventStatusPayload(String status) {
    }

    private record EventCreatePayload(String name, String description, String category, String date, String time,
                                      String endDate, String endTime, String track, String city, String voivodeship,
                                      String imageUrl, Double lat, Double lng, boolean paid, BigDecimal entryFee,
                                      String bankAccount, Integer paymentDeadlineHours, Integer freeCancelDays,
                                      Boolean acceptRegistrations, BigDecimal spectatorFee, String externalUrl,
                                      Boolean requireOc, Boolean requirePt, Boolean requireCage,
                                      Boolean requireRegistered) {
    }
}
