package pl.raceportal.dto;

/**
 * Publiczne, zagregowane statystyki (bez danych osobowych).
 */
public final class PublicStatsDtos {

    private PublicStatsDtos() {
    }

    /**
     * {@code registeredUsers} = {@code UserRepository.count()} —
     * ta sama reguła co pole {@code users} w {@code AdminDtos.StatsResponse}.
     */
    public record PublicStatsResponse(long registeredUsers) {
    }
}
