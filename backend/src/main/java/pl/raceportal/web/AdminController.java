package pl.raceportal.web;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.service.AdminService;
import pl.raceportal.web.dto.AdminDtos;
import pl.raceportal.web.dto.AuthDtos;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final AdminService admin;

  public AdminController(AdminService admin) {
    this.admin = admin;
  }

  @GetMapping("/stats")
  public AdminDtos.StatsResponse stats() {
    return admin.stats();
  }

  @GetMapping("/users")
  public List<Map<String, Object>> users() {
    return admin.listUsers();
  }

  @PatchMapping("/users/{id}/role")
  public AuthDtos.UserResponse updateRole(@PathVariable String id, @Valid @RequestBody AdminDtos.RoleRequest req) {
    return admin.updateRole(id, req.role());
  }

  @GetMapping("/events/pending")
  public List<?> pendingEvents() {
    return admin.pendingEvents();
  }

  @PatchMapping("/events/{id}/status")
  public Object updateEventStatus(@PathVariable String id, @Valid @RequestBody AdminDtos.EventStatusRequest req) {
    return admin.updateEventStatus(id, req.status());
  }

  @GetMapping("/organizer-applications")
  public List<Map<String, Object>> applications() {
    return admin.applications();
  }

  @PatchMapping("/organizer-applications/{id}")
  public Map<String, Object> updateApplication(
      @PathVariable String id, @Valid @RequestBody AdminDtos.ApplicationStatusRequest req) {
    return admin.updateApplication(id, req.status());
  }
}
