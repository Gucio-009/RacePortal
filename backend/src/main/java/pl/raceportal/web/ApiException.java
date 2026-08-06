package pl.raceportal.web;

import org.springframework.http.HttpStatus;

/**
 * Wyjątek biznesowy API z kodem HTTP i opcjonalnymi szczegółami walidacji.
 * <p>
 * Rola w architekturze: standardowy sposób sygnalizowania błędów z warstwy serwisów
 * do {@link GlobalExceptionHandler} (bez mieszania z wyjątkami frameworka).
 * Technologie: Spring Web ({@link HttpStatus}).
 * </p>
 * Fabryki statyczne ({@link #badRequest}, {@link #notFound} itd.) ułatwiają czytelne rzucanie.
 * <p>
 * Pomysł (alt): sealed hierarchy błędów domenowych + mapper do HTTP;
 * ProblemDetail zamiast własnego {@link ErrorResponse}.
 * </p>
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    /** Opcjonalne szczegóły (np. mapa pól) — serializowane w {@link ErrorResponse}. */
    private final transient Object details;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, Object details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    /** Używane m.in. przy błędach proxy do OSRM / zewnętrznych API. */
    public static ApiException badGateway(String message) {
        return new ApiException(HttpStatus.BAD_GATEWAY, message);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Object getDetails() {
        return details;
    }
}
