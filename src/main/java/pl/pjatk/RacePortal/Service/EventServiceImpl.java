package pl.pjatk.RacePortal.Service;

import pl.pjatk.RacePortal.Dto.Event.EventCreateUpdateDto;
import pl.pjatk.RacePortal.Dto.Event.EventDetailsDto;
import pl.pjatk.RacePortal.Dto.Event.EventListDto;
import pl.pjatk.RacePortal.Entities.Event;
import pl.pjatk.RacePortal.mapper.EventMapper;
import pl.pjatk.RacePortal.Repository.CategoryRepository;
import pl.pjatk.RacePortal.Repository.EventRepository;
import pl.pjatk.RacePortal.Repository.LocationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final EventMapper eventMapper;

    public EventServiceImpl(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            LocationRepository locationRepository,
            EventMapper eventMapper
    ) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.locationRepository = locationRepository;
        this.eventMapper = eventMapper;
    }

    /* ================= LISTA / FILTROWANIE ================= */

    @Override
    @Transactional(readOnly = true)
    public List<EventListDto> getFilteredEvents(
            Long categoryId,
            Long regionId,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        return eventRepository
                .findFiltered(categoryId, regionId, dateFrom, dateTo)
                .stream()
                .map(eventMapper::toListDto)
                .toList();
    }

    /* ================= SZCZEGÓŁY ================= */

    @Override
    @Transactional(readOnly = true)
    public EventDetailsDto getEventDetails(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Event not found: " + eventId)
                );

        return eventMapper.toDetailsDto(event);
    }

    /* ================= CREATE ================= */

    @Override
    public EventDetailsDto createEvent(EventCreateUpdateDto dto) {

        Event event = eventMapper.toEntity(dto);

        event.setCategory(
                categoryRepository.findById(dto.getCategoryId())
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Category not found: " + dto.getCategoryId()
                                ))
        );

        event.setLocation(
                locationRepository.findById(dto.getLocationId())
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Location not found: " + dto.getLocationId()
                                ))
        );

        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());

        Event saved = eventRepository.save(event);

        return eventMapper.toDetailsDto(saved);
    }
}
