package RACEPORTAL.RACEPORTAL.Mapper;

import RACEPORTAL.RACEPORTAL.Dto.CategoryDto;
import RACEPORTAL.RACEPORTAL.Entities.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryDto toDto(Category category);
}
