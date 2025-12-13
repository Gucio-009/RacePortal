package RACEPORTAL.RACEPORTAL.Mapper;

import RACEPORTAL.RACEPORTAL.Dto.Event.EventCreateUpdateDto;
import RACEPORTAL.RACEPORTAL.Dto.Event.EventDetailsDto;
import RACEPORTAL.RACEPORTAL.Dto.Event.EventListDto;
import RACEPORTAL.RACEPORTAL.Entities.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = { CategoryMapper.class, LocationMapper.class }
)
public interface EventMapper {

    /* ========= LISTA / KALENDARZ ========= */

    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "location.name", target = "locationName")
    @Mapping(source = "location.region.name", target = "regionName")
    EventListDto toListDto(Event event);

    /* ========= SZCZEGÓŁY ========= */

    EventDetailsDto toDetailsDto(Event event);

    /* ========= CREATE / UPDATE ========= */

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "location", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Event toEntity(EventCreateUpdateDto dto);
}
