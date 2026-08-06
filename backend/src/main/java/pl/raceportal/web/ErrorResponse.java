package pl.raceportal.web;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standardowa odpowiedź błędu JSON dla klienta SPA.
 * <p>
 * Rola w architekturze: kontrakt błędów API — {@code error} (komunikat) + opcjonalne
 * {@code details} (np. błędy pól). Używane przez {@link GlobalExceptionHandler}
 * oraz handlery Spring Security.
 * Technologie: Jackson ({@code NON_NULL} ukrywa puste details).
 * </p>
 * Pomysł (alt): RFC 7807 {@code ProblemDetail} z polami type/title/status/detail.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String error, Object details) {

    public ErrorResponse(String error) {
        this(error, null);
    }
}
