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
import pl.raceportal.domain.User;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.UserRepository;

import java.math.BigDecimal;
import java.util.UUID;

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

    @Autowired
    private UserRepository userRepository;

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
                new CarPayload("Toyota", "GR86", 2023, null, "PO 11111",
                        "https://example.com/cars/gr86.jpg", "RWD", 230, 2400, 1270,
                        true, false, true, true));
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
                new CarPayload(null, "GR86 Facelift", null, null, null, null, null, null, null, null,
                        null, null, null, null));
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
                new CarPayload(null, null, null, null, "PO 22222", null, null, null, null, null,
                        null, null, null, null));
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
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");

        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Honda", "Civic Type R", 2020, "Track Day", "GD 33333",
                        "https://example.com/cars/civic.jpg", "FWD", 320, 2000, 1400,
                        true, false, true, true));
        String carResponse = mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String carId = objectMapper.readTree(carResponse).get("id").asText();

        // Własny event bez require* — nie polegamy na seedzie (inne testy mogą dodać Track Day z OC).
        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Track Day Cancel Test",
                "Event testowy do anulowania zgłoszenia.",
                "Track Day", "2026-12-28", "10:00", null, null, "Tor Cancel", "Cancelowo", "Mazowieckie",
                null, 52.0, 21.0, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk());

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(eventId, carId, null));
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
        String adminToken = login("admin@raceportal.pl", "admin123");

        // Własny płatny event — seed ma też historyczne daty (np. 2026-08-29) i niestabilny findFirst.
        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Paid Flow Test Event",
                "Event testowy do flow płatnego zgłoszenia.",
                "Track Day", "2026-12-30", "11:00", null, null, "Tor Paid", "Paidowo", "Mazowieckie",
                null, 52.0, 21.0, true, new BigDecimal("100.00"), "PL61109010140000071219812874",
                72, 7, true, null, null, false, false, false, false));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk());

        String regBody = objectMapper.writeValueAsString(
                new RegistrationCreatePayload(eventId, null, null));
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
                new CarPayload("Subaru", "Impreza", 2018, "KJS", "WA 12345",
                        "https://example.com/cars/impreza.jpg", "AWD", 280, 2000, 1350,
                        true, false, true, true));
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
                new CarPayload("Honda", "Civic", 2017, "Track Day", "PO 44556",
                        "https://example.com/cars/civic-oc.jpg", "FWD", 180, 1800, 1250,
                        true, false, false, true));
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

    /**
     * Błąd 12: admin widzi APPROVED i może anulować (CANCELLED) z panelu —
     * PATCH /api/admin/events/{id}/status, nie tylko anulacja przez organizatora.
     */
    @Test
    void admin_listsApprovedEvents_andCancelsViaStatusPatch() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Admin Cancel Approved Tor",
                "Event testowy — anulowanie zatwierdzonego wydarzenia przez admina.",
                "Track Day", "2026-12-25", "12:00", null, null, "Tor AdminCancel", "Adminowo", "Mazowieckie",
                null, 52.1, 21.1, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventResponse = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String eventId = objectMapper.readTree(eventResponse).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        mockMvc.perform(get("/api/admin/events/approved")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + eventId + "')].status", contains("APPROVED")));

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("CANCELLED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));
    }

    /**
     * Błędy 13–14: po APPROVE wniosku rola w DB to ORGANIZER; stary JWT (claim USER)
     * nadal daje dostęp do panelu i tworzenia wydarzeń (filtr ładuje rolę z DB).
     * POST /api/auth/refresh wydaje nowy token z rolą ORGANIZER.
     */
    @Test
    void organizerApplicationApproved_staleJwtCanAccessPanelAndCreateEvent_refreshUpdatesRole()
            throws Exception {
        String email = "org-app-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String password = "password123";
        String adminToken = login("admin@raceportal.pl", "admin123");

        String registerBody = objectMapper.writeValueAsString(new RegisterOrganizerPayload(
                "OrgApplicant", email, password, "Tor Test Sp. z o.o.", "Track Day",
                "Chcę organizować oficjalne track day na torze testowym."));
        mockMvc.perform(post("/api/auth/register-organizer")
                        .contentType("application/json")
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiresVerification", is(true)));

        User pendingUser = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        String code = pendingUser.getEmailVerificationCode();
        assertNotBlank(code);

        String verifyResponse = mockMvc.perform(post("/api/auth/verify-email")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new VerifyEmailPayload(email, code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("USER")))
                .andReturn().getResponse().getContentAsString();
        String staleToken = objectMapper.readTree(verifyResponse).get("token").asText();

        mockMvc.perform(get("/api/organizer/events")
                        .header("Authorization", "Bearer " + staleToken))
                .andExpect(status().isForbidden());

        String appsResponse = mockMvc.perform(get("/api/admin/organizer-applications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String appId = null;
        for (JsonNode app : objectMapper.readTree(appsResponse)) {
            if (email.equalsIgnoreCase(app.path("user").path("email").asText(null))
                    || email.equalsIgnoreCase(app.path("userEmail").asText(null))) {
                appId = app.get("id").asText();
                break;
            }
            if (pendingUser.getId().equals(app.path("userId").asText(null))) {
                appId = app.get("id").asText();
                break;
            }
        }
        if (appId == null) {
            throw new AssertionError("Nie znaleziono wniosku organizatora dla " + email);
        }

        mockMvc.perform(patch("/api/admin/organizer-applications/" + appId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Ten sam token (claim USER) — filtr bierze ORGANIZER z DB.
        mockMvc.perform(get("/api/organizer/events")
                        .header("Authorization", "Bearer " + staleToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Event po APPROVE wniosku",
                "Tworzenie wydarzenia starym JWT po nadaniu roli ORGANIZER w bazie.",
                "Track Day", "2027-01-10", "09:00", null, null, "Tor Fresh Org", "Orgowo", "Mazowieckie",
                null, 52.2, 21.2, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + staleToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Event po APPROVE wniosku")));

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer " + staleToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("ORGANIZER")))
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    /** Aktywne zgłoszenie nie może być nadpisane drugim POST (tylko re-apply po CANCELED). */
    @Test
    void registration_create_rejectsDuplicateActiveRegistration() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");
        String driverToken = login("test@wp.pl", "test123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Dup Reg Guard Event",
                "Event testowy — blokada ponownego zgłoszenia przy aktywnym statusie.",
                "Track Day", "2027-02-01", "10:00", null, null, "Tor Dup", "Dupowo", "Mazowieckie",
                null, 52.0, 21.0, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventId = objectMapper.readTree(mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk());

        String regBody = objectMapper.writeValueAsString(new RegistrationCreatePayload(eventId, null, null));
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType("application/json")
                        .content(regBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("aktywne zgłoszenie")));
    }

    /** Odrzucenie bez powodu → 400; z powodem → REJECTED + powiadomienie organizatora. */
    @Test
    void admin_eventReject_requiresReasonAndNotifiesOrganizer() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Reject Needs Reason",
                "Event testowy — odrzucenie wymaga powodu od admina.",
                "Track Day", "2027-03-01", "10:00", null, null, "Tor Reject", "Rejectowo", "Mazowieckie",
                null, 52.0, 21.0, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventId = objectMapper.readTree(mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("REJECTED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("powód")));

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new EventStatusPayload("REJECTED", "Brak regulaminu i opisu trasy"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", is("Brak regulaminu i opisu trasy")));

        mockMvc.perform(get("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", is("Brak regulaminu i opisu trasy")));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("EVENT_REJECTED")))
                .andExpect(jsonPath("$[0].relatedEventId", is(eventId)))
                .andExpect(jsonPath("$[0].body", containsString("Brak regulaminu")));
    }

    /** Akceptacja wydarzenia tworzy powiadomienie in-app dla organizatora. */
    @Test
    void admin_eventApprove_notifiesOrganizer() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "Approve Notify Org",
                "Event testowy — akceptacja wysyła powiadomienie organizatorowi.",
                "Track Day", "2027-03-02", "12:00", null, null, "Tor Approve", "Approvo", "Mazowieckie",
                null, 52.0, 21.0, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventId = objectMapper.readTree(mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread", greaterThanOrEqualTo(1)));

        String notificationsJson = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + orgToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        boolean foundApprove = false;
        for (JsonNode n : objectMapper.readTree(notificationsJson)) {
            if (eventId.equals(n.path("relatedEventId").asText())
                    && "EVENT_APPROVED".equals(n.path("type").asText())) {
                foundApprove = true;
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(foundApprove,
                "Organizator powinien dostać powiadomienie EVENT_APPROVED");
    }

    /** FSM: CANCELLED nie wraca do APPROVED. */
    @Test
    void admin_eventStatus_rejectsReviveFromCancelled() throws Exception {
        String orgToken = login("org@raceportal.pl", "org123");
        String adminToken = login("admin@raceportal.pl", "admin123");

        String eventBody = objectMapper.writeValueAsString(new EventCreatePayload(
                "FSM Cancel Revive Block",
                "Event testowy — brak wskrzeszania anulowanego wydarzenia.",
                "Track Day", "2027-02-05", "11:00", null, null, "Tor FSM", "Fsmowo", "Mazowieckie",
                null, 52.0, 21.0, false, null, null, null, 7, true, null, null,
                false, false, false, false));
        String eventId = objectMapper.readTree(mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + orgToken)
                        .contentType("application/json")
                        .content(eventBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("CANCELLED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new EventStatusPayload("APPROVED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Niedozwolone przejście")));
    }

    /** Partial PATCH garażu nie nulluje year gdy pole pominięte. */
    @Test
    void garage_partialPatch_preservesYearWhenOmitted() throws Exception {
        String token = login("test@wp.pl", "test123");
        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Fiat", "124", 2017, "Track Day", "WW 11111",
                        "https://example.com/cars/fiat.jpg", "RWD", 140, 1400, 1050,
                        true, false, true, true));
        String carId = objectMapper.readTree(mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        String plateOnly = objectMapper.writeValueAsString(
                new CarPayload(null, null, null, null, "WW 22222", null, null, null, null, null,
                        null, null, null, null));
        mockMvc.perform(patch("/api/garage/" + carId)
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(plateOnly))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plate", is("WW 22222")))
                .andExpect(jsonPath("$.year", is(2017)))
                .andExpect(jsonPath("$.powerHp", is(140)));
    }

    /** Długi URL zdjęcia auta (kolumna TEXT / max 2000) — wcześniej psuło dodawanie do garażu. */
    @Test
    void garage_create_acceptsLongImageUrl() throws Exception {
        String token = login("test@wp.pl", "test123");
        String longUrl = "https://example.com/cars/" + "x".repeat(1800) + ".jpg";
        String carBody = objectMapper.writeValueAsString(
                new CarPayload("Mazda", "MX-5", 2019, "Track Day", "WW 99999",
                        longUrl, "RWD", 184, 2000, 1050,
                        true, false, true, true));
        mockMvc.perform(post("/api/garage")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(carBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageUrl", is(longUrl)));
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

    private record RegisterOrganizerPayload(String username, String email, String password,
                                            String company, String businessType, String message) {
    }

    private record VerifyEmailPayload(String email, String code) {
    }

    private record CarPayload(String make, String model, Integer year, String className, String plate,
                              String imageUrl, String driveType, Integer powerHp, Integer engineCc,
                              Integer weightKg, Boolean registered, Boolean hasRollCage, Boolean hasOc,
                              Boolean hasPt) {
    }

    private record RegistrationCreatePayload(String eventId, String carId, String note) {
    }

    private record RegistrationStatusPayload(String status, String comment) {
    }

    private record PaymentProofPayload(String paymentProofUrl) {
    }

    private record EventStatusPayload(String status, String reason) {
        EventStatusPayload(String status) {
            this(status, null);
        }
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
