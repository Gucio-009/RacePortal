package pl.pjatk.RacePortal.Controllers;

import pl.pjatk.RacePortal.Dto.Event.EventCreateUpdateDto;
import pl.pjatk.RacePortal.Dto.Event.EventDetailsDto;
import pl.pjatk.RacePortal.Dto.Event.EventListDto;
import pl.pjatk.RacePortal.Service.EventService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /* ================= LISTA + FILTROWANIE ================= */

    @GetMapping
    public List<EventListDto> getEvents(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dateTo
    ) {
        return eventService.getFilteredEvents(
                categoryId,
                regionId,
                dateFrom,
                dateTo
        );
    }

    /* ================= SZCZEGÓŁY ================= */

    @GetMapping("/{id}")
    public EventDetailsDto getEventDetails(@PathVariable Long id) {
        return eventService.getEventDetails(id);
    }

    /* ================= CREATE ================= */

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventDetailsDto createEvent(
            @RequestBody EventCreateUpdateDto dto
    ) {
        return eventService.createEvent(dto);
    }
}
