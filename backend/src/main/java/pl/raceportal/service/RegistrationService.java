package pl.raceportal.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.EventDtos.EventResponse;
import pl.raceportal.dto.GarageDtos.CarResponse;
import pl.raceportal.dto.RegistrationDtos.RegistrationCreateRequest;
import pl.raceportal.dto.RegistrationDtos.RegistrationResponse;
import pl.raceportal.dto.RegistrationDtos.UserRef;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final EventService eventService;
    private final GarageService garageService;
    private final MailService mailService;

    public RegistrationService(RegistrationRepository registrationRepository, EventRepository eventRepository,
                                CarRepository carRepository, UserRepository userRepository,
                                EventService eventService, GarageService garageService, MailService mailService) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.eventService = eventService;
        this.garageService = garageService;
        this.mailService = mailService;
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> mine(String userId) {
        return registrationRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(r -> serialize(r, true, false))
                .toList();
    }

    /**
     * Diagram "Proces tworzenia zgłoszenia (kierowca)": the event must be
     * accepting registrations and approved; if a car is picked, an obvious
     * class/category mismatch fails the automatic validation step.
     */
    @Transactional
    public RegistrationResponse create(String userId, RegistrationCreateRequest request) {
        Event event = eventRepository.findById(request.eventId()).orElse(null);
        if (event == null || event.getStatus() != EventStatus.APPROVED) {
            throw ApiException.badRequest("Nie można zgłosić się na to wydarzenie");
        }
        if (!event.isAcceptRegistrations()) {
            throw ApiException.badRequest("Organizator zamknął zgłoszenia do tego wydarzenia");
        }

        Car car = null;
        if (request.carId() != null && !request.carId().isBlank()) {
            car = carRepository.findByIdAndUser_Id(request.carId(), userId)
                    .orElseThrow(() -> ApiException.badRequest("Nieprawidłowe auto"));

            if (car.getClassName() != null && !car.getClassName().isBlank()
                    && event.getCategory() != null && !event.getCategory().isBlank()
                    && !car.getClassName().equalsIgnoreCase(event.getCategory())) {
                throw ApiException.badRequest(
                        "Klasa wybranego auta (" + car.getClassName() + ") nie pasuje do kategorii wydarzenia (" +
                                event.getCategory() + ")");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        Registration registration = registrationRepository.findByUser_IdAndEvent_Id(userId, event.getId())
                .orElseGet(Registration::new);
        registration.setUser(user);
        registration.setEvent(event);
        registration.setCar(car);
        registration.setNote(request.note());
        registration.setStatus(RegistrationStatus.PENDING);
        registration.setOrganizerComment(null);
        registration.setPaymentProofUrl(null);
        registration.setPaymentDueAt(null);

        registration = registrationRepository.save(registration);

        mailService.send(user.getEmail(), "Zgłoszenie: " + event.getName(),
                "<p>Twoje zgłoszenie na <strong>" + event.getName() +
                        "</strong> zostało przyjęte i oczekuje na decyzję organizatora.</p>");

        return serialize(registration, true, false);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> listForEvent(String eventId, UserPrincipal currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }

        return registrationRepository.findByEvent_IdOrderByCreatedAtDesc(eventId).stream()
                .map(r -> serialize(r, false, true))
                .toList();
    }

    /**
     * Organizer decision from the "Proces weryfikacji zgłoszeń" diagrams. Free
     * events go PENDING -&gt; CONFIRMED/CANCELED directly; paid events go
     * PENDING -&gt; ACCEPTED/CANCELED first, then ACCEPTED -&gt; CONFIRMED only once
     * a payment proof is attached (ACCEPTED can still be CANCELED without proof).
     * "APPROVED" is accepted as an alias and smart-resolved based on event.paid
     * and the registration's current status.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public RegistrationResponse updateStatus(String id, String statusValue, String comment, UserPrincipal currentUser) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        Event event = registration.getEvent();
        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }

        RegistrationStatus target = resolveTargetStatus(statusValue, event.isPaid(), registration.getStatus());
        validateTransition(registration.getStatus(), target, registration, event);

        registration.setStatus(target);
        if (comment != null && !comment.isBlank()) {
            registration.setOrganizerComment(comment);
        }
        if (target == RegistrationStatus.ACCEPTED && event.isPaid()) {
            int hours = event.getPaymentDeadlineHours() != null ? event.getPaymentDeadlineHours() : 72;
            registration.setPaymentDueAt(Instant.now().plus(hours, ChronoUnit.HOURS));
        }

        registration = registrationRepository.save(registration);

        sendStatusUpdateMail(registration, event, target);

        return serialize(registration, true, true);
    }

    /**
     * Diagram "Proces anulowania zgłoszenia (kierowca)": the driver can always
     * end up CANCELED. If the registration was already paid (CONFIRMED on a
     * paid event) and the organizer's free-cancel window has not passed, the
     * email mentions that the organizer will issue a refund.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public RegistrationResponse cancelByDriver(String id, String userId) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        if (!registration.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Brak uprawnień");
        }
        if (registration.getStatus() == RegistrationStatus.CANCELED) {
            throw ApiException.badRequest("Zgłoszenie jest już anulowane");
        }

        Event event = registration.getEvent();
        boolean alreadyPaid = event.isPaid() && registration.getStatus() == RegistrationStatus.CONFIRMED;
        boolean refundByOrganizer = false;
        if (alreadyPaid) {
            int freeCancelDays = event.getFreeCancelDays() != null ? event.getFreeCancelDays() : 7;
            LocalDate deadline = event.getDate().minusDays(freeCancelDays);
            refundByOrganizer = !LocalDate.now().isAfter(deadline);
        }

        registration.setStatus(RegistrationStatus.CANCELED);
        registration = registrationRepository.save(registration);

        String refundNote = refundByOrganizer
                ? "<p>Zwrot środków za zgłoszenie zostanie zrealizowany przez organizatora.</p>"
                : "";
        mailService.send(registration.getUser().getEmail(), "Rezygnacja ze zgłoszenia: " + event.getName(),
                "<p>Potwierdzamy anulowanie Twojego zgłoszenia na <strong>" + event.getName() + "</strong>.</p>" +
                        refundNote);

        return serialize(registration, true, false);
    }

    /**
     * Diagram "Proces opłacania zgłoszenia (kierowca)": once ACCEPTED on a paid
     * event, the driver attaches proof of the bank transfer for the organizer
     * to verify (a separate {@link #updateStatus} call moves it to CONFIRMED).
     */
    @Transactional
    public RegistrationResponse attachPaymentProof(String id, String userId, String paymentProofUrl) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono"));

        if (!registration.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Brak uprawnień");
        }

        Event event = registration.getEvent();
        if (!event.isPaid() || registration.getStatus() != RegistrationStatus.ACCEPTED) {
            throw ApiException.badRequest(
                    "Potwierdzenie przelewu można dodać tylko dla zaakceptowanego zgłoszenia na płatne wydarzenie");
        }

        registration.setPaymentProofUrl(paymentProofUrl);
        registration = registrationRepository.save(registration);

        return serialize(registration, true, false);
    }

    private RegistrationStatus resolveTargetStatus(String rawStatus, boolean eventPaid, RegistrationStatus current) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw ApiException.badRequest("Nieprawidłowy status");
        }
        String normalized = rawStatus.trim().toUpperCase(Locale.ROOT);

        return switch (normalized) {
            case "CANCELED", "CANCELLED", "REJECTED" -> RegistrationStatus.CANCELED;
            case "CONFIRMED" -> RegistrationStatus.CONFIRMED;
            case "ACCEPTED" -> RegistrationStatus.ACCEPTED;
            case "APPROVED" -> {
                // Legacy alias: free → CONFIRMED; paid PENDING → ACCEPTED; paid ACCEPTED → CONFIRMED
                if (!eventPaid) {
                    yield RegistrationStatus.CONFIRMED;
                }
                if (current == RegistrationStatus.PENDING) {
                    yield RegistrationStatus.ACCEPTED;
                }
                yield RegistrationStatus.CONFIRMED;
            }
            case "PENDING" -> RegistrationStatus.PENDING;
            default -> throw ApiException.badRequest("Nieprawidłowy status");
        };
    }

    private void validateTransition(RegistrationStatus from, RegistrationStatus to, Registration registration,
                                     Event event) {
        if (from == RegistrationStatus.CANCELED || from == RegistrationStatus.CONFIRMED) {
            throw ApiException.badRequest("Nie można zmienić statusu zgłoszenia zakończonego");
        }
        boolean valid = switch (from) {
            case PENDING -> event.isPaid()
                    ? (to == RegistrationStatus.ACCEPTED || to == RegistrationStatus.CANCELED)
                    : (to == RegistrationStatus.CONFIRMED || to == RegistrationStatus.CANCELED);
            case ACCEPTED -> to == RegistrationStatus.CONFIRMED || to == RegistrationStatus.CANCELED;
            default -> false;
        };
        if (!valid) {
            throw ApiException.badRequest("Nieprawidłowe przejście statusu zgłoszenia");
        }
        if (to == RegistrationStatus.CONFIRMED && from == RegistrationStatus.ACCEPTED
                && (registration.getPaymentProofUrl() == null || registration.getPaymentProofUrl().isBlank())) {
            throw ApiException.badRequest("Brak potwierdzenia przelewu — nie można potwierdzić zgłoszenia");
        }
    }

    private void sendStatusUpdateMail(Registration registration, Event event, RegistrationStatus status) {
        String bankNote = "";
        if (status == RegistrationStatus.ACCEPTED && event.isPaid()) {
            int hours = event.getPaymentDeadlineHours() != null ? event.getPaymentDeadlineHours() : 72;
            bankNote = "<p>Aby potwierdzić udział, wpłać wpisowe w ciągu " + hours + " godzin na numer konta: " +
                    "<strong>" + event.getBankAccount() + "</strong> i dołącz potwierdzenie przelewu w swoim profilu.</p>";
        }
        mailService.send(registration.getUser().getEmail(), "Status zgłoszenia: " + event.getName(),
                "<p>Status Twojego zgłoszenia na <strong>" + event.getName() + "</strong>: <strong>" +
                        status + "</strong>.</p>" + bankNote);
    }

    private RegistrationResponse serialize(Registration registration, boolean includeEvent, boolean includeUser) {
        EventResponse eventResponse = includeEvent ? eventService.serialize(registration.getEvent()) : null;
        CarResponse carResponse = registration.getCar() != null ? garageService.serialize(registration.getCar()) : null;
        UserRef userRef = includeUser
                ? new UserRef(registration.getUser().getId(), registration.getUser().getUsername(),
                        registration.getUser().getEmail(), registration.getUser().getAvatar())
                : null;

        return new RegistrationResponse(
                registration.getId(),
                registration.getUser().getId(),
                registration.getEvent().getId(),
                registration.getCar() != null ? registration.getCar().getId() : null,
                registration.getStatus().name(),
                registration.getNote(),
                registration.getOrganizerComment(),
                registration.getPaymentProofUrl(),
                registration.getPaymentDueAt() != null ? registration.getPaymentDueAt().toString() : null,
                registration.getCreatedAt().toString(),
                registration.getUpdatedAt().toString(),
                eventResponse,
                carResponse,
                userRef
        );
    }
}
