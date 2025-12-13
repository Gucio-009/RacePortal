package RACEPORTAL.RACEPORTAL.Mapper;

import RACEPORTAL.RACEPORTAL.Dto.LocationDto;
import RACEPORTAL.RACEPORTAL.Entities.Location;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = { RegionMapper.class }
)
public interface LocationMapper {

    LocationDto toDto(Location location);
}
