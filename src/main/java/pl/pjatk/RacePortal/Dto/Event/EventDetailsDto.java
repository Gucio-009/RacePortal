package pl.pjatk.RacePortal.Dto.Event;

import lombok.Data;
import pl.pjatk.RacePortal.Dto.CategoryDto;
import pl.pjatk.RacePortal.Dto.LocationDto;

import java.time.LocalDate;
@Data
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
    //private Long organizerId;

    // getters & setters
}
