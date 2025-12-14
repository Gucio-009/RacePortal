package pl.pjatk.RacePortal.mapper;

import org.mapstruct.ReportingPolicy;
import pl.pjatk.RacePortal.Dto.LocationDto;
import pl.pjatk.RacePortal.Entities.Location;
import org.mapstruct.Mapper;

@Mapper(
        componentModel = "spring",
        uses = { RegionMapper.class },
        unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface LocationMapper {

    LocationDto toDto(Location location);
}
