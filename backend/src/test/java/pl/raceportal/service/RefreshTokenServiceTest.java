package pl.raceportal.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import pl.raceportal.domain.RefreshToken;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.RefreshTokenRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.web.ApiException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pentest #9 / #2: rotacja refresh + reuse starego tokena ubija wszystkie sesje.
 */
class RefreshTokenServiceTest {

    private final Map<String, RefreshToken> byHash = new HashMap<>();
    private RefreshTokenRepository tokens;
    private UserRepository users;
    private RefreshTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        byHash.clear();
        tokens = mock(RefreshTokenRepository.class);
        users = mock(UserRepository.class);
        when(tokens.save(any())).thenAnswer(inv -> {
            RefreshToken t = inv.getArgument(0);
            byHash.put(t.getTokenHash(), t);
            return t;
        });
        when(tokens.findByTokenHash(any())).thenAnswer(inv ->
                Optional.ofNullable(byHash.get(inv.getArgument(0))));
        when(tokens.revokeAllForUser(any())).thenAnswer(inv -> {
            String userId = inv.getArgument(0);
            int n = 0;
            for (RefreshToken t : byHash.values()) {
                if (t.getUser().getId().equals(userId) && !t.isRevoked()) {
                    t.setRevoked(true);
                    n++;
                }
            }
            return n;
        });
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service = new RefreshTokenService(tokens, users, 7);
        user = new User();
        user.setId("user-1");
        user.setEmail("a@b.pl");
        user.setUsername("Driver");
        user.setRole(Role.USER);
        user.setTokenVersion(0);
    }

    @Test
    void rotate_fiveTimes_withNewTokenEachTime_succeeds() {
        String current = service.issue(user);
        for (int i = 0; i < 5; i++) {
            var rotated = service.rotate(current);
            assertNotEquals(current, rotated.rawRefresh());
            current = rotated.rawRefresh();
        }
        assertNotEquals(current, service.rotate(current).rawRefresh());
    }

    @Test
    void reuse_afterRotation_revokesAllSessionsIncludingSuccessor() {
        String first = service.issue(user);
        String second = service.rotate(first).rawRefresh();

        ApiException ex = assertThrows(ApiException.class, () -> service.rotate(first));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertTrue(ex.getMessage().contains("unieważniona"));
        verify(tokens, times(1)).revokeAllForUser("user-1");
        assertEquals(1, user.getTokenVersion());

        assertThrows(ApiException.class, () -> service.rotate(second));
    }

    @Test
    void oldTokenFromMiddleOfChain_alsoTriggersReuseKill() {
        String t1 = service.issue(user);
        String t2 = service.rotate(t1).rawRefresh();
        String t3 = service.rotate(t2).rawRefresh();

        assertThrows(ApiException.class, () -> service.rotate(t2));
        assertThrows(ApiException.class, () -> service.rotate(t3));
        assertThrows(ApiException.class, () -> service.rotate(t1));
    }
}
