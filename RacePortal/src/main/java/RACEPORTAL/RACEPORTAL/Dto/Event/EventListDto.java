package RACEPORTAL.RACEPORTAL.Dto.Event;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EventListDto {

    private Long id;
    private String title;

    private LocalDate dateStart;
    private LocalDate dateEnd;

    private String categoryName;
    private String locationName;
    private String regionName;
}
