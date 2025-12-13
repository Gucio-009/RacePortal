package RACEPORTAL.RACEPORTAL.Service;

import RACEPORTAL.RACEPORTAL.Dto.Event.EventCreateUpdateDto;
import RACEPORTAL.RACEPORTAL.Dto.Event.EventDetailsDto;
import RACEPORTAL.RACEPORTAL.Dto.Event.EventListDto;

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
