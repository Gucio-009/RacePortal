package pl.raceportal.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.dto.RegistrationDtos.PaymentProofRequest;
import pl.raceportal.dto.RegistrationDtos.RegistrationCreateRequest;
import pl.raceportal.dto.RegistrationDtos.RegistrationResponse;
import pl.raceportal.dto.RegistrationDtos.RegistrationStatusUpdateRequest;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.service.RegistrationService;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@PreAuthorize("isAuthenticated()")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<RegistrationResponse>> mine(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.mine(currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<RegistrationResponse> create(@AuthenticationPrincipal UserPrincipal currentUser,
                                                         @Valid @RequestBody RegistrationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.create(currentUser.getId(), request));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<RegistrationResponse>> forEvent(@PathVariable String eventId,
                                                                @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.listForEvent(eventId, currentUser));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<RegistrationResponse> updateStatus(@PathVariable String id,
                                                              @Valid @RequestBody RegistrationStatusUpdateRequest request,
                                                              @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                registrationService.updateStatus(id, request.status(), request.comment(), currentUser));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RegistrationResponse> cancel(@PathVariable String id,
                                                        @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.cancelByDriver(id, currentUser.getId()));
    }

    @PostMapping("/{id}/payment-proof")
    public ResponseEntity<RegistrationResponse> attachPaymentProof(@PathVariable String id,
                                                                    @Valid @RequestBody PaymentProofRequest request,
                                                                    @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                registrationService.attachPaymentProof(id, currentUser.getId(), request.paymentProofUrl()));
    }
}
