package pl.raceportal.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {
  private final JdbcTemplate jdbc;

  public HealthController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    try {
      jdbc.queryForObject("SELECT 1", Integer.class);
      return Map.of("ok", true, "db", "up");
    } catch (Exception e) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Baza niedostępna");
    }
  }
}
