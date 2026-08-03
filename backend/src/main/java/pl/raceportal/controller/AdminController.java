package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.AdminDtos.EventStatusUpdateRequest;
import pl.raceportal.dto.AdminDtos.OrganizerApplicationResponse;
import pl.raceportal.dto.AdminDtos.OrganizerApplicationStatusUpdateRequest;
import pl.raceportal.dto.AdminDtos.RoleUpdateRequest;
import pl.raceportal.dto.AdminDtos.StatsResponse;
import pl.raceportal.dto.AdminDtos.UserAdminResponse;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.AdminService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> stats() {
        return ResponseEntity.ok(adminService.stats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminResponse>> users() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserAdminResponse> updateUserRole(@PathVariable String id,
                                                             @Valid @RequestBody RoleUpdateRequest request,
                                                             @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request, currentUser));
    }

    @GetMapping("/events/pending")
    public ResponseEntity<List<EventResponse>> pendingEvents() {
        return ResponseEntity.ok(adminService.pendingEvents());
    }

    @PatchMapping("/events/{id}/status")
    public ResponseEntity<EventResponse> updateEventStatus(@PathVariable String id,
                                                            @Valid @RequestBody EventStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateEventStatus(id, request));
    }

    @GetMapping("/organizer-applications")
    public ResponseEntity<List<OrganizerApplicationResponse>> organizerApplications() {
        return ResponseEntity.ok(adminService.organizerApplications());
    }

    @PatchMapping("/organizer-applications/{id}")
    public ResponseEntity<OrganizerApplicationResponse> updateOrganizerApplication(
            @PathVariable String id, @Valid @RequestBody OrganizerApplicationStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateOrganizerApplicationStatus(id, request.status()));
    }
}
