package pl.raceportal.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventPointsRule;
import pl.raceportal.domain.EventResult;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.ResultStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.EventResultDtos.EventResultResponse;
import pl.raceportal.dto.EventResultDtos.EventResultUpsertRequest;
import pl.raceportal.dto.EventResultDtos.PointsRuleItem;
import pl.raceportal.dto.EventResultDtos.PointsRuleResponse;
import pl.raceportal.dto.EventResultDtos.PointsRulesReplaceRequest;
import pl.raceportal.dto.EventResultDtos.RecalcResult;
import pl.raceportal.repository.EventPointsRuleRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.EventResultRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
@Service
public class EventResultService {

    private final EventResultRepository eventResultRepository;
    private final EventPointsRuleRepository pointsRuleRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventResultService(EventResultRepository eventResultRepository,
                               EventPointsRuleRepository pointsRuleRepository,
                               EventRepository eventRepository,
                               RegistrationRepository registrationRepository) {
        this.eventResultRepository = eventResultRepository;
        this.pointsRuleRepository = pointsRuleRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResultResponse> list(String eventId, UserPrincipal currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wydarzenia"));
        if (!event.isResultsPublished()) {
            requireOwnerOrAdmin(event, currentUser);
        }
        return eventResultRepository.findByEvent_IdOrderByPositionAscCreatedAtAsc(eventId).stream()
                .map(this::serialize)
                .toList();
    }

    @Transactional
    public EventResultResponse upsert(String eventId, EventResultUpsertRequest request, UserPrincipal currentUser) {
        Event event = requireOwnedEvent(eventId, currentUser);
        Registration reg = registrationRepository.findById(request.registrationId())
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono zgłoszenia"));
        if (!reg.getEvent().getId().equals(eventId)) {
            throw ApiException.badRequest("Zgłoszenie nie należy do tego wydarzenia");
        }
        if (reg.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiException.badRequest("Wyniki można wpisywać tylko dla potwierdzonych zgłoszeń");
        }

        EventResult result = eventResultRepository.findByRegistration_Id(reg.getId())
                .orElseGet(EventResult::new);
        result.setEvent(event);
        result.setRegistration(reg);
        result.setEventClass(reg.getAssignedClass());
        result.setStartNumber(request.startNumber());
        result.setPosition(request.position());
        String display = RaceTimeParser.normalizeDisplay(request.timeDisplay());
        result.setTimeDisplay(display);
        result.setTimeMs(display != null ? RaceTimeParser.parseToMs(display) : null);
        result.setPoints(request.points());
        result.setStatus(parseStatus(request.status()));
        result.setNote(blankToNull(request.note()));
        result = eventResultRepository.save(result);
        return serialize(result);
    }

    @Transactional
    public void delete(String eventId, String resultId, UserPrincipal currentUser) {
        requireOwnedEvent(eventId, currentUser);
        EventResult result = eventResultRepository.findByIdAndEvent_Id(resultId, eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wyniku"));
        eventResultRepository.delete(result);
    }

    /**
     * Buduje wiersze wyników dla wszystkich CONFIRMED bez istniejącego wyniku.
     */
    @Transactional
    public List<EventResultResponse> ensureRows(String eventId, UserPrincipal currentUser) {
        Event event = requireOwnedEvent(eventId, currentUser);
        List<Registration> confirmed = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(eventId).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .toList();
        int nextStart = 1;
        List<EventResult> existing = eventResultRepository.findByEvent_IdOrderByPositionAscCreatedAtAsc(eventId);
        for (EventResult er : existing) {
            if (er.getStartNumber() != null && er.getStartNumber() >= nextStart) {
                nextStart = er.getStartNumber() + 1;
            }
        }
        for (Registration reg : confirmed) {
            if (eventResultRepository.findByRegistration_Id(reg.getId()).isPresent()) {
                continue;
            }
            EventResult row = new EventResult();
            row.setEvent(event);
            row.setRegistration(reg);
            row.setEventClass(reg.getAssignedClass());
            row.setStartNumber(nextStart++);
            row.setStatus(ResultStatus.OK);
            eventResultRepository.save(row);
        }
        return list(eventId, currentUser);
    }

    @Transactional
    public RecalcResult recalcPositionsAndPoints(String eventId, UserPrincipal currentUser) {
        requireOwnedEvent(eventId, currentUser);
        List<EventResult> all = eventResultRepository.findByEvent_IdOrderByPositionAscCreatedAtAsc(eventId);
        Map<String, List<EventResult>> byClass = new HashMap<>();
        for (EventResult r : all) {
            String key = r.getEventClass() != null ? r.getEventClass().getId() : "__overall__";
            byClass.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }
        Map<Integer, Integer> pointsByPlace = new HashMap<>();
        for (EventPointsRule rule : pointsRuleRepository.findByEvent_IdOrderByPlaceAsc(eventId)) {
            pointsByPlace.put(rule.getPlace(), rule.getPoints());
        }

        int updated = 0;
        for (List<EventResult> group : byClass.values()) {
            List<EventResult> ranked = group.stream()
                    .filter(r -> r.getStatus() == ResultStatus.OK && r.getTimeMs() != null)
                    .sorted(Comparator.comparing(EventResult::getTimeMs))
                    .toList();
            int place = 1;
            for (EventResult r : ranked) {
                r.setPosition(place);
                if (pointsByPlace.containsKey(place)) {
                    r.setPoints(pointsByPlace.get(place));
                }
                place++;
                updated++;
            }
            for (EventResult r : group) {
                if (r.getStatus() != ResultStatus.OK || r.getTimeMs() == null) {
                    r.setPosition(null);
                }
            }
        }
        eventResultRepository.saveAll(all);
        return new RecalcResult(updated);
    }

    @Transactional(readOnly = true)
    public List<PointsRuleResponse> listPointsRules(String eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw ApiException.notFound("Nie znaleziono wydarzenia");
        }
        return pointsRuleRepository.findByEvent_IdOrderByPlaceAsc(eventId).stream()
                .map(r -> new PointsRuleResponse(r.getId(), eventId, r.getPlace(), r.getPoints()))
                .toList();
    }

    @Transactional
    public List<PointsRuleResponse> replacePointsRules(String eventId, PointsRulesReplaceRequest request,
                                                        UserPrincipal currentUser) {
        Event event = requireOwnedEvent(eventId, currentUser);
        pointsRuleRepository.deleteByEvent_Id(eventId);
        List<PointsRuleItem> items = request.rules() != null ? request.rules() : List.of();
        for (PointsRuleItem item : items) {
            EventPointsRule rule = new EventPointsRule();
            rule.setEvent(event);
            rule.setPlace(item.place());
            rule.setPoints(item.points());
            pointsRuleRepository.save(rule);
        }
        return listPointsRules(eventId);
    }

    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public void setPublished(String eventId, boolean published, UserPrincipal currentUser) {
        Event event = requireOwnedEvent(eventId, currentUser);
        event.setResultsPublished(published);
        eventRepository.save(event);
    }

    private Event requireOwnedEvent(String eventId, UserPrincipal currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono wydarzenia"));
        requireOwnerOrAdmin(event, currentUser);
        return event;
    }

    private void requireOwnerOrAdmin(Event event, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw ApiException.unauthorized("Wymagane logowanie");
        }
        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw ApiException.forbidden("Brak uprawnień");
        }
    }

    private static ResultStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return ResultStatus.OK;
        }
        try {
            return ResultStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Nieprawidłowy status wyniku (OK, DNF, DNS, DSQ)");
        }
    }

    private EventResultResponse serialize(EventResult r) {
        Registration reg = r.getRegistration();
        User user = reg.getUser();
        String driverName = joinName(user);
        String carLabel = null;
        if (reg.getCar() != null) {
            carLabel = reg.getCar().getMake() + " " + reg.getCar().getModel();
        }
        return new EventResultResponse(
                r.getId(),
                r.getEvent().getId(),
                reg.getId(),
                user.getId(),
                driverName,
                carLabel,
                r.getEventClass() != null ? r.getEventClass().getId() : null,
                r.getEventClass() != null ? r.getEventClass().getName() : null,
                r.getStartNumber(),
                r.getPosition(),
                r.getTimeMs(),
                r.getTimeDisplay(),
                r.getPoints(),
                r.getStatus().name(),
                r.getNote(),
                r.getUpdatedAt().toString()
        );
    }

    private static String joinName(User user) {
        String first = user.getFirstName();
        String last = user.getLastName();
        if (first != null && !first.isBlank() || last != null && !last.isBlank()) {
            return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        }
        return user.getUsername();
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
