package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByOrderByCreatedAtDesc();
}
