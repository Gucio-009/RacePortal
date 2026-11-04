package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.EventResult;
import pl.raceportal.domain.Registration;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.User;
import pl.raceportal.dto.StartListDtos.StartListEntry;
import pl.raceportal.dto.StartListDtos.StartListResponse;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.EventResultRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.web.ApiException;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StartListService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final EventResultRepository eventResultRepository;

    public StartListService(EventRepository eventRepository,
                             RegistrationRepository registrationRepository,
                             EventResultRepository eventResultRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.eventResultRepository = eventResultRepository;
    }

    @Transactional(readOnly = true)
    public StartListResponse list(String eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw ApiException.notFound("Nie znaleziono wydarzenia");
        }
        Map<String, Integer> startByReg = new HashMap<>();
        for (EventResult r : eventResultRepository.findByEvent_IdOrderByPositionAscCreatedAtAsc(eventId)) {
            if (r.getStartNumber() != null) {
                startByReg.put(r.getRegistration().getId(), r.getStartNumber());
            }
        }
        List<StartListEntry> items = registrationRepository.findByEvent_IdOrderByCreatedAtDesc(eventId).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .map(r -> toEntry(r, startByReg.get(r.getId())))
                .sorted(Comparator
                        .comparing((StartListEntry e) -> e.startNumber() == null ? Integer.MAX_VALUE : e.startNumber())
                        .thenComparing(StartListEntry::driverName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new StartListResponse(eventId, items);
    }

    private static StartListEntry toEntry(Registration r, Integer startNumber) {
        User user = r.getUser();
        String driverName = joinName(user);
        String carLabel = null;
        if (r.getCar() != null) {
            carLabel = r.getCar().getMake() + " " + r.getCar().getModel();
        }
        return new StartListEntry(
                r.getId(),
                startNumber,
                driverName,
                carLabel,
                r.getAssignedClass() != null ? r.getAssignedClass().getId() : null,
                r.getAssignedClass() != null ? r.getAssignedClass().getName() : null
        );
    }

    private static String joinName(User user) {
        String first = user.getFirstName();
        String last = user.getLastName();
        if ((first != null && !first.isBlank()) || (last != null && !last.isBlank())) {
            return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        }
        return user.getUsername();
    }
}
