package pl.raceportal.web;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP klienta za Cloudflare Tunnel / reverse proxy.
 */
public final class ClientIp {

    private ClientIp() {
    }

    public static String from(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String cf = request.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) {
            return cf.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) {
            return real.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
