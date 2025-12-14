package pl.pjatk.RacePortal.mapper;

import org.mapstruct.ReportingPolicy;
import pl.pjatk.RacePortal.Dto.RegionDto;
import pl.pjatk.RacePortal.Entities.Region;
import org.mapstruct.Mapper;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface RegionMapper {

    RegionDto toDto(Region region);
}
