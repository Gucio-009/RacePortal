package pl.raceportal.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ścisłe typy JSON (pentest #11): liczba / bool / tablica nie zamienia się po cichu w String.
 * Obce pola (np. {@code role}) nadal ignorowane — bez mass-assignment.
 */
@Configuration
public class JacksonConfig {

    @Bean
    Jackson2ObjectMapperBuilderCustomizer strictJsonScalarTypes() {
        return builder -> builder.postConfigurer(mapper -> {
            // Nie włączamy FAIL_ON_UNKNOWN_PROPERTIES — nieznane pola są odrzucane z modelu, nie z requestu.
            mapper.coercionConfigFor(LogicalType.Textual)
                    .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Array, CoercionAction.Fail);
            mapper.coercionConfigFor(LogicalType.Boolean)
                    .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Array, CoercionAction.Fail);
            mapper.coercionConfigFor(LogicalType.Integer)
                    .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Array, CoercionAction.Fail);
            mapper.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
        });
    }
}
