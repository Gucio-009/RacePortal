package pl.raceportal.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Pentest #11: ObjectMapper nie konwertuje po cichu Integer → String. */
class JacksonStrictTypesTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.json();
        new JacksonConfig().strictJsonScalarTypes().customize(builder);
        mapper = builder.build();
    }

    @Test
    void rejectsNumericUsername() {
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"username\":12345}", UpdateMeRequest.class));
    }

    @Test
    void rejectsBooleanAsUsername() {
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"username\":true}", UpdateMeRequest.class));
    }

    @Test
    void acceptsStringUsernameAndIgnoresUnknownRole() throws Exception {
        UpdateMeRequest req = mapper.readValue(
                "{\"username\":\"Kierowca\",\"role\":\"ADMIN\"}", UpdateMeRequest.class);
        assertEquals("Kierowca", req.username());
    }
}
