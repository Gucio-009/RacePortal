package pl.raceportal.web;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String error, Object details) {

    public ErrorResponse(String error) {
        this(error, null);
    }
}
