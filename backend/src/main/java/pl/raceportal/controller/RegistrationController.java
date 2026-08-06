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

/**
 * REST API zgłoszeń na wydarzenia (kierowca + organizator).
 * <p>
 * Rola w architekturze: endpointy flow dyplomowego — tworzenie, decyzja statusu,
 * anulowanie, dowód płatności. Wymaga JWT; lista/status — ORGANIZER/ADMIN + ownership w serwisie.
 * Technologie: Spring Security RBAC, Bean Validation, JPA, Mail.
 * </p>
 * Pomysł (alt): WebSocket powiadomień o zmianie statusu; Stripe Checkout zamiast proof URL.
 */
@RestController
@RequestMapping("/api/registrations")
@PreAuthorize("isAuthenticated()")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /** Historia zgłoszeń zalogowanego kierowcy. */
    @GetMapping("/mine")
    public ResponseEntity<List<RegistrationResponse>> mine(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.mine(currentUser.getId()));
    }

    /** Nowe zgłoszenie / upsert PENDING na wydarzenie APPROVED. */
    @PostMapping
    public ResponseEntity<RegistrationResponse> create(@AuthenticationPrincipal UserPrincipal currentUser,
                                                         @Valid @RequestBody RegistrationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.create(currentUser.getId(), request));
    }

    /** Lista zgłoszeń na wydarzenie — organizator-właściciel lub admin. */
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<RegistrationResponse>> forEvent(@PathVariable String eventId,
                                                                @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.listForEvent(eventId, currentUser));
    }

    /**
     * Decyzja organizatora o statusie (ACCEPTED/CONFIRMED/CANCELED + aliasy).
     * Reguły płatności egzekwowane w serwisie.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<RegistrationResponse> updateStatus(@PathVariable String id,
                                                              @Valid @RequestBody RegistrationStatusUpdateRequest request,
                                                              @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                registrationService.updateStatus(id, request.status(), request.comment(), currentUser));
    }

    /** Rezygnacja kierowcy → CANCELED (+ ewentualna wzmianka o zwrocie). */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<RegistrationResponse> cancel(@PathVariable String id,
                                                        @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(registrationService.cancelByDriver(id, currentUser.getId()));
    }

    /** Dołączenie URL dowodu przelewu (tylko ACCEPTED + wydarzenie płatne). */
    @PostMapping("/{id}/payment-proof")
    public ResponseEntity<RegistrationResponse> attachPaymentProof(@PathVariable String id,
                                                                    @Valid @RequestBody PaymentProofRequest request,
                                                                    @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                registrationService.attachPaymentProof(id, currentUser.getId(), request.paymentProofUrl()));
    }
}
