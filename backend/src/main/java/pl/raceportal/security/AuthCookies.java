package pl.raceportal.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * httpOnly cookies sesji: krótki access ({@code rp_at}) + refresh ({@code rp_rt}).
 * Secure/SameSite z konfiguracji (prod: Secure=true).
 */
@Component
public class AuthCookies {

    public static final String ACCESS_COOKIE = "rp_at";
    public static final String REFRESH_COOKIE = "rp_rt";

    private final boolean secure;
    private final String sameSite;

    public AuthCookies(
            @Value("${app.cookies.secure:false}") boolean secure,
            @Value("${app.cookies.same-site:Lax}") String sameSite) {
        this.secure = secure;
        this.sameSite = sameSite == null || sameSite.isBlank() ? "Lax" : sameSite;
    }

    public void setAccessToken(HttpServletResponse response, String token, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(ACCESS_COOKIE, token, maxAge, "/").toString());
    }

    public void setRefreshToken(HttpServletResponse response, String token, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(REFRESH_COOKIE, token, maxAge, "/api/auth").toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(ACCESS_COOKIE, "", Duration.ZERO, "/").toString());
        response.addHeader(HttpHeaders.SET_COOKIE, build(REFRESH_COOKIE, "", Duration.ZERO, "/api/auth").toString());
    }

    public String readAccess(HttpServletRequest request) {
        return read(request, ACCESS_COOKIE);
    }

    public String readRefresh(HttpServletRequest request) {
        return read(request, REFRESH_COOKIE);
    }

    private ResponseCookie build(String name, String value, Duration maxAge, String path) {
        return ResponseCookie.from(name, value == null ? "" : value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(maxAge)
                .build();
    }

    private static String read(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                String v = cookie.getValue();
                return v == null || v.isBlank() ? null : v;
            }
        }
        return null;
    }
}
