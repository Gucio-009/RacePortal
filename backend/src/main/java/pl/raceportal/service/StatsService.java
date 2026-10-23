package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.repository.UserRepository;

/**
 * Wspólne liczniki zagregowane — panel admina i publiczne API muszą używać tych samych reguł.
 */
@Service
public class StatsService {

    private final UserRepository userRepository;

    public StatsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Liczba wszystkich zarejestrowanych kont (nie „aktywnych użytkowników”). */
    @Transactional(readOnly = true)
    public long countRegisteredUsers() {
        return userRepository.count();
    }
}
