package pl.raceportal.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import pl.raceportal.web.ApiException;

public final class AuthSupport {
  private AuthSupport() {}

  public static UserPrincipal requireUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie");
    }
    return principal;
  }

  public static UserPrincipal optionalUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
      return principal;
    }
    return null;
  }
}
