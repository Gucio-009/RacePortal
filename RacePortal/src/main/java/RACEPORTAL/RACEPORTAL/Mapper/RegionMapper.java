package RACEPORTAL.RACEPORTAL.Mapper;

import RACEPORTAL.RACEPORTAL.Dto.RegionDto;
import RACEPORTAL.RACEPORTAL.Entities.Region;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RegionMapper {

    RegionDto toDto(Region region);
}
