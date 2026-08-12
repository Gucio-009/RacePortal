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

/**
 * Serwis zgłoszeń zawodników na wydarzenia — statusy, płatności, anulowanie.
 * <p>
 * Rola w architekturze: rdzeń reguł biznesowych dyplomu (Statusy zgłoszenia):
 * tworzenie zgłoszenia, decyzja organizatora, dowód płatności, rezygnacja kierowcy.
 * Technologie: Spring, JPA/MySQL, Spring Cache (evict listy wydarzeń), Mail.
 * </p>
 * Przepływ płatny: PENDING → ACCEPTED (+{@code paymentDueAt}) → dowód → CONFIRMED;
 * darmowy: PENDING → CONFIRMED. Alias {@code APPROVED} mapowany „smart” wg {@code event.paid}.
 * RBAC: lista/zmiana statusu — organizator-właściciel lub ADMIN; anulowanie/proof — właściciel zgłoszenia.
 * <p>
 * Pomysł (alt): maszyna stanów Spring State Machine; bramka PayU/Stripe zamiast ręcznego dowodu;
 * outbox do maili.
 * </p>
 */
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
     * Tworzenie zgłoszenia (diagram „Proces tworzenia zgłoszenia”): wydarzenie APPROVED
     * i otwarte na zgłoszenia; opcjonalne auto — walidacja klasy vs kategorii (CategoryMatcher).
     * Upsert po (user, event): resetuje status na PENDING.
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
                    && !CategoryMatcher.matches(car.getClassName(), event.getCategory())) {
                throw ApiException.badRequest(
                        "Klasa wybranego auta (" + car.getClassName() + ") nie pasuje do kategorii wydarzenia (" +
                                event.getCategory() + ")");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        validateEventRequirements(event, user, car);

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

    /**
     * Lista zgłoszeń na wydarzenie — tylko organizator-właściciel lub ADMIN (RBAC).
     */
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
     * Decyzja organizatora (diagram „Proces weryfikacji zgłoszeń”).
     * Darmowe: PENDING → CONFIRMED/CANCELED; płatne: PENDING → ACCEPTED/CANCELED,
     * potem ACCEPTED → CONFIRMED tylko z dowodem płatności.
     * Alias {@code APPROVED} rozwiązywany wg {@code event.paid} i bieżącego statusu.
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
     * Anulowanie przez kierowcę (diagram „Proces anulowania zgłoszenia”).
     * Przy CONFIRMED na płatnym wydarzeniu w oknie {@code freeCancelDays}
     * mail wspomina o zwrocie przez organizatora.
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
     * Dołączenie dowodu przelewu (diagram „Proces opłacania zgłoszenia”):
     * tylko ACCEPTED + wydarzenie płatne; potwierdzenie CONFIRMED robi organizator
     * przez {@link #updateStatus}.
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

    /**
     * Mapuje surowy status z API (w tym legacy APPROVED/CANCELLED/REJECTED)
     * na docelowy {@link RegistrationStatus} z uwzględnieniem płatności.
     */
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

    /**
     * Waliduje dozwolone przejścia maszyny stanów; CONFIRMED z ACCEPTED wymaga dowodu płatności.
     */
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

    /**
     * Minimalna walidacja wymogów wydarzenia po stronie backendu.
     * Spójna reguła biznesowa: jeśli event ma aktywny wymóg, zgłoszenie bez spełnienia warunku jest odrzucane.
     */
    private void validateEventRequirements(Event event, User user, Car car) {
        if (event.isRequireDrivingLicense() && !user.isHasDrivingLicenseB()) {
            throw ApiException.badRequest("To wydarzenie wymaga prawa jazdy kategorii B");
        }
        if (event.isRequirePzmLicense() && (user.getPzmLicense() == null || user.getPzmLicense().isBlank())) {
            throw ApiException.badRequest("To wydarzenie wymaga licencji PZM");
        }
        if ((event.isRequireOc() || event.isRequirePt() || event.isRequireCage() || event.isRequireRegistered()) && car == null) {
            throw ApiException.badRequest("To wydarzenie wymaga wyboru auta spełniającego warunki techniczne");
        }
        if (event.isRequireOc() && car != null && !car.isHasOc()) {
            throw ApiException.badRequest("Wybrane auto nie ma ważnego OC");
        }
        if (event.isRequirePt() && car != null && !car.isHasPt()) {
            throw ApiException.badRequest("Wybrane auto nie ma ważnego przeglądu technicznego");
        }
        if (event.isRequireCage() && car != null && !car.isHasRollCage()) {
            throw ApiException.badRequest("Wybrane auto nie ma wymaganej klatki bezpieczeństwa");
        }
        if (event.isRequireRegistered() && car != null && !car.isRegistered()) {
            throw ApiException.badRequest("Wybrane auto nie jest zarejestrowane");
        }
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
