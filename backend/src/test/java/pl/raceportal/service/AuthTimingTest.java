package pl.raceportal.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AuthDtos.AuthResponse;
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.repository.BugReportRepository;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.NotificationRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RefreshTokenRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.AttemptRateLimiter;
import pl.raceportal.security.JwtService;
import pl.raceportal.web.ApiException;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pentest #5: logowanie i reset hasła nie mogą być szybsze, gdy emaila nie ma w bazie.
 */
class AuthTimingTest {

    private static final String DUMMY_HASH = "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdu";
    private static final String STORED_HASH = "$2a$10$storedhashstoredhashstoredhashstoredhashstored";

    @Test
    void login_unknownEmailStillRunsPasswordHash() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn(DUMMY_HASH);
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        when(encoder.matches(anyString(), anyString())).thenReturn(false);

        AuthService auth = service(users, encoder, mock(MailService.class), mock(JwtService.class), mock(RefreshTokenService.class));

        ApiException ex = assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest("missing@example.com", "wrong-password"), "127.0.0.1"));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(encoder).matches("wrong-password", DUMMY_HASH);
    }

    @Test
    void login_wrongPasswordUsesStoredHashNotDummy() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn(DUMMY_HASH);
        when(encoder.matches(anyString(), anyString())).thenReturn(false);
        UserRepository users = mock(UserRepository.class);
        User user = account("stored-hash-placeholder");
        user.setPasswordHash(STORED_HASH);
        when(users.findByEmailIgnoreCase("real@example.com")).thenReturn(Optional.of(user));

        AuthService auth = service(users, encoder, mock(MailService.class), mock(JwtService.class), mock(RefreshTokenService.class));

        assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest("real@example.com", "wrong-password"), "127.0.0.1"));

        verify(encoder).matches("wrong-password", STORED_HASH);
    }

    @Test
    void login_correctPasswordStillIssuesSession() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        UserRepository users = mock(UserRepository.class);
        User user = account(encoder.encode("Secret1!aa"));
        setCreatedAt(user);
        when(users.findByEmailIgnoreCase("real@example.com")).thenReturn(Optional.of(user));
        JwtService jwt = mock(JwtService.class);
        when(jwt.generateToken(any())).thenReturn("access-token");
        RefreshTokenService refresh = mock(RefreshTokenService.class);
        when(refresh.issue(any())).thenReturn("refresh-token");

        AuthService auth = service(users, encoder, mock(MailService.class), jwt, refresh);

        AuthResponse response = auth.login(new LoginRequest("real@example.com", "Secret1!aa"), "127.0.0.1");

        assertEquals("access-token", response.token());
        assertEquals("refresh-token", response.refreshToken());
    }

    /**
     * Bez kontrolnego hasha brak konta wraca w kilka ms, a złe hasło w czas BCrypt (rozłączne rozkłady).
     * Mediany obu ścieżek muszą być w tym samym rzędzie — każda co najwyżej 2× dłuższa od drugiej.
     */
    @Test
    void login_unknownEmailTakesAsLongAsWrongPassword() {
        PasswordEncoder encoder = new BCryptPasswordEncoder(10);
        UserRepository users = mock(UserRepository.class);
        User user = account(encoder.encode("Secret1!aa"));
        when(users.findByEmailIgnoreCase("real@example.com")).thenReturn(Optional.of(user));
        when(users.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        AuthService auth = service(users, encoder, mock(MailService.class), mock(JwtService.class), mock(RefreshTokenService.class));

        for (int i = 0; i < 2; i++) {
            timeLogin(auth, "missing@example.com");
            timeLogin(auth, "real@example.com");
        }
        long[] unknown = new long[5];
        long[] known = new long[5];
        for (int i = 0; i < 5; i++) {
            unknown[i] = timeLogin(auth, "missing@example.com");
            known[i] = timeLogin(auth, "real@example.com");
        }
        long unknownMs = median(unknown);
        long knownMs = median(known);

        assertTrue(unknownMs >= 15 && knownMs >= 15,
                "bcrypt nie wykonał się na obu ścieżkach: unknown=" + unknownMs + " known=" + knownMs);
        assertTrue(unknownMs * 2 > knownMs && knownMs * 2 > unknownMs,
                "czas zdradza konto: unknown=" + unknownMs + "ms known=" + knownMs + "ms");
    }

    @Test
    void forgotPassword_unknownEmailStillSendsDecoyAndStoresNothing() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn(DUMMY_HASH);
        UserRepository users = mock(UserRepository.class);
        when(users.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        MailService mail = mock(MailService.class);
        when(mail.sendDecoy(anyString(), anyString())).thenReturn(true);

        AuthService auth = service(users, encoder, mail, mock(JwtService.class), mock(RefreshTokenService.class));
        auth.forgotPassword("Missing@Example.com", "127.0.0.1");

        ArgumentCaptor<String> html = ArgumentCaptor.forClass(String.class);
        verify(mail).sendDecoy(eq("Reset hasła RACEPORTAL"), html.capture());
        assertTrue(html.getValue().contains("/reset-password/"));
        assertFalse(html.getValue().contains("missing@example.com"));
        verify(mail, never()).send(anyString(), anyString(), anyString());
        verify(users, never()).save(any());
    }

    @Test
    void forgotPassword_knownEmailSendsResetAndKeepsToken() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn(DUMMY_HASH);
        UserRepository users = mock(UserRepository.class);
        User user = account(STORED_HASH);
        when(users.findByEmailIgnoreCase("real@example.com")).thenReturn(Optional.of(user));
        MailService mail = mock(MailService.class);
        when(mail.send(anyString(), anyString(), anyString())).thenReturn(true);

        AuthService auth = service(users, encoder, mail, mock(JwtService.class), mock(RefreshTokenService.class));
        auth.forgotPassword("real@example.com", "127.0.0.1");

        assertNotNull(user.getPasswordResetToken());
        assertNotNull(user.getPasswordResetExpires());
        verify(users).save(user);
        verify(mail).send(eq("real@example.com"), eq("Reset hasła RACEPORTAL"), contains("/reset-password/" + user.getPasswordResetToken()));
        verify(mail, never()).sendDecoy(anyString(), anyString());
    }

    private static long timeLogin(AuthService auth, String email) {
        long start = System.nanoTime();
        assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest(email, "wrong-password"), "127.0.0.1"));
        return (System.nanoTime() - start) / 1_000_000L;
    }

    private static long median(long[] samples) {
        long[] copy = Arrays.copyOf(samples, samples.length);
        Arrays.sort(copy);
        return copy[copy.length / 2];
    }

    private static User account(String passwordHash) {
        User user = new User();
        user.setId("user-1");
        user.setEmail("real@example.com");
        user.setUsername("RealUser");
        user.setRole(Role.USER);
        user.setEmailVerified(true);
        user.setPasswordHash(passwordHash);
        return user;
    }

    private static void setCreatedAt(User user) throws Exception {
        Field createdAt = User.class.getDeclaredField("createdAt");
        createdAt.setAccessible(true);
        createdAt.set(user, Instant.parse("2026-01-01T00:00:00Z"));
    }

    private static AuthService service(UserRepository users, PasswordEncoder encoder, MailService mail,
                                       JwtService jwt, RefreshTokenService refresh) {
        return new AuthService(users, mock(OrganizerApplicationRepository.class),
                mock(EventRepository.class), mock(RegistrationRepository.class), mock(CarRepository.class),
                mock(NotificationRepository.class), mock(BugReportRepository.class), mock(RefreshTokenRepository.class),
                encoder, jwt, refresh, mail,
                mock(GoogleIdTokenService.class), mock(AttemptRateLimiter.class), "http://localhost:8081");
    }
}
