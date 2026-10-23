package pl.raceportal.dto;

/**
 * Odpowiedź po uploadzie obrazu (URL do użycia w imageUrl / paymentProofUrl).
 */
public final class UploadDtos {

    private UploadDtos() {
    }

    public record UploadResponse(String url, String contentType, long sizeBytes) {
    }
}
