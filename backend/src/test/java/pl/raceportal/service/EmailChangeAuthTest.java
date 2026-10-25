package pl.raceportal.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.AttemptRateLimiter;
import pl.raceportal.security.JwtService;
import pl.raceportal.web.ApiException;

import java.time.Instant;
import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Pentest #8: zmiana e-maila wymaga hasła i alertu na stary adres. */
class EmailChangeAuthTest {

    @Test
    void requestEmailChange_rejectsWrongPassword() {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        UserRepository users = mock(UserRepository.class);
        User user = account(encoder.encode("Secret1!aa"));
        when(users.findById("user-1")).thenReturn(Optional.of(user));
        MailService mail = mock(MailService.class);
        AuthService auth = service(users, encoder, mail, mock(RefreshTokenService.class));

        ApiException ex = assertThrows(ApiException.class,
                () -> auth.requestEmailChange("user-1", "attacker@example.com", "WrongPass1!"));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(mail, never()).send(anyString(), anyString(), anyString());
        verify(users, never()).save(any());
    }

    @Test
    void requestEmailChange_sendsConfirmToNewAndAlertToOld() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        UserRepository users = mock(UserRepository.class);
        User user = account(encoder.encode("Secret1!aa"));
        setCreatedAt(user);
        when(users.findById("user-1")).thenReturn(Optional.of(user));
        when(users.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));
        MailService mail = mock(MailService.class);
        when(mail.send(anyString(), anyString(), anyString())).thenReturn(true);
        AuthService auth = service(users, encoder, mail, mock(RefreshTokenService.class));

        auth.requestEmailChange("user-1", "new@example.com", "Secret1!aa");

        assertEquals("new@example.com", user.getPendingEmail());
        verify(mail).send(eq("new@example.com"), eq("Potwierdź nowy e-mail RACEPORTAL"), contains("/verify-email/"));
        verify(mail).send(eq("real@example.com"), eq("Prośba o zmianę e-maila RACEPORTAL"), contains("new@example.com"));
    }

    @Test
    void confirmEmailChange_revokesSessions() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        UserRepository users = mock(UserRepository.class);
        User user = account(encoder.encode("Secret1!aa"));
        setCreatedAt(user);
        user.setPendingEmail("new@example.com");
        user.setEmailVerificationCode("abcdef0123456789abcdef01");
        user.setEmailVerificationExpires(Instant.now().plusSeconds(3600));
        when(users.findById("user-1")).thenReturn(Optional.of(user));
        when(users.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));
        JwtService jwt = mock(JwtService.class);
        when(jwt.generateToken(any())).thenReturn("access");
        RefreshTokenService refresh = mock(RefreshTokenService.class);
        when(refresh.issue(any())).thenReturn("refresh");
        AuthService auth = new AuthService(users, mock(OrganizerApplicationRepository.class), encoder, jwt, refresh,
                mock(MailService.class), mock(GoogleIdTokenService.class), mock(AttemptRateLimiter.class),
                "http://localhost:8081");

        auth.confirmEmailChange("user-1", "abcdef0123456789abcdef01");

        verify(refresh).revokeAllAndBump(user);
        assertEquals("new@example.com", user.getEmail());
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
                                       RefreshTokenService refresh) {
        return new AuthService(users, mock(OrganizerApplicationRepository.class), encoder, mock(JwtService.class),
                refresh, mail, mock(GoogleIdTokenService.class), mock(AttemptRateLimiter.class),
                "http://localhost:8081");
    }
}
