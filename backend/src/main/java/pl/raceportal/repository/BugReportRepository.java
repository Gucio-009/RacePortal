package pl.raceportal.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pl.raceportal.domain.BugReport;

import java.util.List;

public interface BugReportRepository extends JpaRepository<BugReport, String> {

    @Query("""
            select b from BugReport b
            left join fetch b.user
            order by b.createdAt desc
            """)
    List<BugReport> findRecent(Pageable pageable);
}
