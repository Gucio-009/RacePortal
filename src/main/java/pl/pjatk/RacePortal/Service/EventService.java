package pl.pjatk.RacePortal.Service;

import  pl.pjatk.RacePortal.Dto.Event.EventCreateUpdateDto;
import  pl.pjatk.RacePortal.Dto.Event.EventDetailsDto;
import  pl.pjatk.RacePortal.Dto.Event.EventListDto;

import java.time.LocalDate;
import java.util.List;

public interface EventService {

    List<EventListDto> getFilteredEvents(
            Long categoryId,
            Long regionId,
            LocalDate dateFrom,
            LocalDate dateTo
    );

    EventDetailsDto getEventDetails(Long eventId);

    EventDetailsDto createEvent(EventCreateUpdateDto dto);
}
