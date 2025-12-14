package pl.pjatk.RacePortal.Dto.Event;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Data
public class EventCreateUpdateDto {

    private String title;
    private String description;

    private LocalDate dateStart;
    private LocalDate dateEnd;

    private String imageUrl;

    private Long categoryId;
    private Long locationId;

    // getters & setters
}
