package pl.raceportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.raceportal.domain.Notification;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findTop50ByUser_IdOrderByCreatedAtDesc(String userId);

    long countByUser_IdAndReadFalse(String userId);

    Optional<Notification> findByIdAndUser_Id(String id, String userId);

    List<Notification> findByUser_IdAndReadFalse(String userId);

    void deleteByUser_Id(String userId);
}
