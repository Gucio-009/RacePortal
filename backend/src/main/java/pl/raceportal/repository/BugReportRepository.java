package pl.raceportal.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.raceportal.domain.BugReport;
import pl.raceportal.domain.BugReportStatus;

import java.util.List;

public interface BugReportRepository extends JpaRepository<BugReport, String> {

    long countByStatus(BugReportStatus status);

    @Query("""
            select b from BugReport b
            left join fetch b.user
            order by b.createdAt desc
            """)
    List<BugReport> findRecent(Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update BugReport b set b.user = null where b.user.id = :userId")
    void detachUser(@Param("userId") String userId);
}
