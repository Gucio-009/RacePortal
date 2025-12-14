package pl.pjatk.RacePortal.mapper;

import org.mapstruct.ReportingPolicy;
import pl.pjatk.RacePortal.Dto.CategoryDto;
import pl.pjatk.RacePortal.Entities.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CategoryMapper {

    CategoryDto toDto(Category category);
}
