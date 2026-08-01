package pl.raceportal.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.User;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
  long countByRole(pl.raceportal.domain.Role role);
}
