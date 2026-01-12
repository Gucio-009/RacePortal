package pl.pjatk.RacePortal.mapper;

import org.mapstruct.ReportingPolicy;
import pl.pjatk.RacePortal.Dto.Event.EventCreateUpdateDto;
import pl.pjatk.RacePortal.Dto.Event.EventDetailsDto;
import pl.pjatk.RacePortal.Dto.Event.EventListDto;
import pl.pjatk.RacePortal.Entities.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = { CategoryMapper.class, LocationMapper.class },
        unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface EventMapper {

    /* ========= LISTA ========= */

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

