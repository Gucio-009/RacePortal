package pl.raceportal.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;

import java.util.Collection;
import java.util.List;

/**
 * Principal Spring Security reprezentujący zalogowanego użytkownika RacePortal.
 * <p>
 * Rola w architekturze: obiekt w SecurityContext — kontrolery/serwisy pobierają
 * {@code id} i {@link Role} do RBAC oraz ownership (garaż, zgłoszenia, wydarzenia).
 * Tworzony z encji {@link User} lub z claims JWT.
 * Technologie: Spring Security {@link UserDetails}.
 * </p>
 * Authority: pojedyncza {@code ROLE_USER|ORGANIZER|ADMIN}.
 * {@link #getUsername()} zwraca email (login systemowy).
 * <p>
 * Pomysł (alt): osobne claimy permissions zamiast jednej roli; OAuth2 {@code Jwt} principal.
 * </p>
 */
public class UserPrincipal implements UserDetails {

    private final String id;
    private final String email;
    private final String username;
    private final String passwordHash;
    private final Role role;

    public UserPrincipal(String id, String email, String username, String passwordHash, Role role) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    /** Buduje principal z encji JPA (np. po logowaniu hasłem). */
    public static UserPrincipal fromUser(User user) {
        return new UserPrincipal(user.getId(), user.getEmail(), user.getUsername(), user.getPasswordHash(), user.getRole());
    }

    public String getId() {
        return id;
    }

    public String getEmailAddress() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    /**
     * Mapuje {@link Role} na authority Spring Security wymagane przez {@code hasRole(...)}.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    /** Login używany przez Spring — email, nie display name. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
