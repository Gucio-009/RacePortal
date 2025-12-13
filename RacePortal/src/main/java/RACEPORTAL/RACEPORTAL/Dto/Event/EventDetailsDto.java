package RACEPORTAL.RACEPORTAL.Dto.Event;

import RACEPORTAL.RACEPORTAL.Dto.CategoryDto;
import RACEPORTAL.RACEPORTAL.Dto.LocationDto;

import java.time.LocalDate;

public class EventDetailsDto {

    private Long id;
    private String title;
    private String description;

    private LocalDate dateStart;
    private LocalDate dateEnd;

    private String imageUrl;

    private CategoryDto category;
    private LocationDto location;

    // organizer później jako osobne DTO
    private Long organizerId;

    // getters & setters
}
