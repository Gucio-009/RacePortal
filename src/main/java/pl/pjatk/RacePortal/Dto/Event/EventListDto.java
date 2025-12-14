package pl.pjatk.RacePortal.Dto.Event;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Data
public class EventListDto {

    private Long id;
    private String title;

    private LocalDate dateStart;
    private LocalDate dateEnd;

    private String categoryName;
    private String locationName;
    private String regionName;
}
