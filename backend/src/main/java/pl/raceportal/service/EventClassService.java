package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventClass;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.Role;
import pl.raceportal.dto.EventClassDtos.AutoAssignResult;
import pl.raceportal.dto.EventClassDtos.EventClassResponse;
import pl.raceportal.dto.EventClassDtos.EventClassUpsertRequest;
import pl.raceportal.repository.EventClassRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

/**
 * CRUD klas zawodów + auto-przydział zgłoszeń.
 */
@Service
public class EventClassService {

    private final EventClassRepository eventClassRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventClassService(EventClassRepository eventClassRepository, EventRepository eventRepository,
                              RegistrationRepository registrationRepository) {
        this.eventClassRepository = eventClassRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<EventClassResponse> list(String eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw ApiException.notFound("Nie znaleziono wydarzenia");
        }
        return eventClassRepository.findByEvent_IdOrderBySortOrderAscCreatedAtAsc(eventId).stream()
                .map(this::serialize)
                .toList();
    }

    @Transactional
    public EventClassResponse create(String eventId, EventClassUpsertRequest request, UserPrincipal currentUser) {
        Event event = requireOwnedEvent(eventId, currentUser);
        EventClass clazz = new EventClass();
        clazz.setEvent(event);
        apply(clazz, request, nextSortOrder(eventId, request.sortOrder()));
        clazz = eventClassRepository.save(clazz);
        return serialize(clazz);
    }

    @Transactional
    public EventClassResponse update(String eventId, String classId, EventClassUpsertRequest request,
                                      UserPrincipal currentUser) {
        requireOwnedEvent(eventId, currentUser);
        EventClass clazz = eventClassRepository.findByIdAndEvent_Id(classId, eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono klasy"));
        int sort = request.sortOrder() != null ? request.sortOrder() : clazz.getSortOrder();
        apply(clazz, request, sort);
        clazz = eventClassRepository.save(clazz);
        return serialize(clazz);
    }

    @Transactional
    public void delete(String eventId, String classId, UserPrincipal currentUser) {
        requireOwnedEvent(eventId, currentUser);
        EventClass clazz = eventClassRepository.findByIdAndEvent_Id(classId, eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono klasy"));
        registrationRepository.clearAssignedClassId(clazz.getId());
        eventClassRepository.delete(clazz);
    }

    /**
     * Przypisuje klasy do wszystkich zgłoszeń wydarzenia (nadpisuje poprzedni przydział).
     */
    @Transactional
    public AutoAssignResult autoAssignAll(String eventId, UserPrincipal currentUser) {
        requireOwnedEvent(eventId, currentUser);
        List<EventClass> classes = eventClassRepository.findByEvent_IdOrderBySortOrderAscCreatedAtAsc(eventId);
        List<Registration> regs = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(eventId);
        int assigned = 0;
        int unassigned = 0;
        for (Registration reg : regs) {
            EventClass match = ClassAssigner.assign(reg.getCar(), classes);
            reg.setAssignedClass(match);
            if (match != null) {
                assigned++;
            } else {
                unassigned++;
            }
        }
        registrationRepository.saveAll(regs);
        return new AutoAssignResult(regs.size(), assigned, unassigned);
    }

    Event requireOwnedEvent(String eventId, UserPrincipal currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wydarzenia"));
        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }
        return event;
    }

    private int nextSortOrder(String eventId, Integer requested) {
        if (requested != null) {
            return requested;
        }
        return (int) eventClassRepository.countByEvent_Id(eventId);
    }

    private void apply(EventClass clazz, EventClassUpsertRequest request, int sortOrder) {
        clazz.setName(request.name().trim());
        clazz.setSortOrder(sortOrder);
        clazz.setMinEngineCc(request.minEngineCc());
        clazz.setMaxEngineCc(request.maxEngineCc());
        if (request.minEngineCc() != null && request.maxEngineCc() != null
                && request.minEngineCc() > request.maxEngineCc()) {
            throw ApiException.badRequest("Minimalna pojemność nie może być większa od maksymalnej");
        }
        clazz.setTurboMultiplier(normalizeMultiplier(request.turboMultiplier()));
        clazz.setSuperchargerMultiplier(normalizeMultiplier(request.superchargerMultiplier()));
        clazz.setAllowedDriveTypes(normalizeDriveCsv(request.allowedDriveTypes()));
        clazz.setRequireCage(Boolean.TRUE.equals(request.requireCage()) ? Boolean.TRUE : null);
        clazz.setRequireRegistered(Boolean.TRUE.equals(request.requireRegistered()) ? Boolean.TRUE : null);
        clazz.setAllowedTireTypes(TireTypes.normalizeCsv(request.allowedTireTypes(), "Opony klasy"));
        clazz.setMaxHpPerTonne(request.maxHpPerTonne());
    }

    private static BigDecimal normalizeMultiplier(BigDecimal value) {
        return value;
    }

    private static String normalizeDriveCsv(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        java.util.LinkedHashSet<String> out = new java.util.LinkedHashSet<>();
        for (String part : raw.split(",")) {
            String v = part.trim().toUpperCase(Locale.ROOT);
            if (v.isEmpty()) {
                continue;
            }
            if ("4WD".equals(v) || "4X4".equals(v)) {
                v = "AWD";
            }
            if (!("FWD".equals(v) || "RWD".equals(v) || "AWD".equals(v))) {
                throw ApiException.badRequest("Nieprawidłowy napęd w klasie: " + part);
            }
            out.add(v);
        }
        return out.isEmpty() ? null : String.join(",", out);
    }

    EventClassResponse serialize(EventClass clazz) {
        return new EventClassResponse(
                clazz.getId(),
                clazz.getEvent().getId(),
                clazz.getName(),
                clazz.getSortOrder(),
                clazz.getMinEngineCc(),
                clazz.getMaxEngineCc(),
                clazz.getTurboMultiplier(),
                clazz.getSuperchargerMultiplier(),
                clazz.getAllowedDriveTypes(),
                clazz.getRequireCage(),
                clazz.getRequireRegistered(),
                clazz.getAllowedTireTypes(),
                clazz.getMaxHpPerTonne(),
                clazz.getCreatedAt().toString(),
                clazz.getUpdatedAt().toString()
        );
    }
}
