package pl.raceportal.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.AttemptRateLimiter;
import pl.raceportal.security.JwtService;
import pl.raceportal.web.ApiException;

import java.time.Instant;
import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Pentest #6: unikalność i rezerwacja nazw wyświetlanych. */
class UsernameClaimTest {

    @Test
    void register_rejectsTakenUsernameWith409() {
        UserRepository users = mock(UserRepository.class);
        when(users.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(users.existsByUsernameIgnoreCase("TakenName")).thenReturn(true);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("hash");
        AuthService auth = service(users, encoder);

        ApiException ex = assertThrows(ApiException.class, () -> auth.register(new RegisterRequest(
                "TakenName", "fresh@example.com", "Password1!",
                null, null, null, null, null, null, null)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(users, never()).save(any());
    }

    @Test
    void register_rejectsReservedUsernameWith400() {
        UserRepository users = mock(UserRepository.class);
        when(users.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(users.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("hash");
        AuthService auth = service(users, encoder);

        ApiException ex = assertThrows(ApiException.class, () -> auth.register(new RegisterRequest(
                "Organizator", "fresh@example.com", "Password1!",
                null, null, null, null, null, null, null)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(users, never()).save(any());
    }

    @Test
    void updateMe_rejectsUsernameTakenBySomeoneElse() throws Exception {
        UserRepository users = mock(UserRepository.class);
        User me = new User();
        me.setId("me");
        me.setEmail("me@example.com");
        me.setUsername("OldName");
        me.setRole(Role.USER);
        setCreatedAt(me);
        when(users.findById("me")).thenReturn(java.util.Optional.of(me));
        when(users.existsByUsernameIgnoreCaseAndIdNot("Stolen", "me")).thenReturn(true);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("hash");
        AuthService auth = service(users, encoder);

        ApiException ex = assertThrows(ApiException.class, () -> auth.updateMe("me", new UpdateMeRequest(
                "Stolen", null, null, null, null, null, null, null, null, null)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(users, never()).save(any());
    }

    @Test
    void updateMe_allowsKeepingOwnUsername() throws Exception {
        UserRepository users = mock(UserRepository.class);
        User me = new User();
        me.setId("me");
        me.setEmail("me@example.com");
        me.setUsername("SameName");
        me.setRole(Role.USER);
        setCreatedAt(me);
        when(users.findById("me")).thenReturn(java.util.Optional.of(me));
        when(users.existsByUsernameIgnoreCaseAndIdNot("SameName", "me")).thenReturn(false);
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("hash");
        AuthService auth = service(users, encoder);

        auth.updateMe("me", new UpdateMeRequest(
                "SameName", null, null, null, null, null, null, null, null, null));

        verify(users).save(me);
        assertEquals("SameName", me.getUsername());
    }

    private static void setCreatedAt(User user) throws Exception {
        Field createdAt = User.class.getDeclaredField("createdAt");
        createdAt.setAccessible(true);
        createdAt.set(user, Instant.parse("2026-01-01T00:00:00Z"));
    }

    private static AuthService service(UserRepository users, PasswordEncoder encoder) {
        return new AuthService(users, mock(OrganizerApplicationRepository.class), encoder,
                mock(JwtService.class), mock(RefreshTokenService.class), mock(MailService.class),
                mock(GoogleIdTokenService.class), mock(AttemptRateLimiter.class), "http://localhost:8081");
    }
}
