package RACEPORTAL.RACEPORTAL.Controllers;

import RACEPORTAL.RACEPORTAL.Dto.RegionDto;
import RACEPORTAL.RACEPORTAL.Mapper.RegionMapper;
import RACEPORTAL.RACEPORTAL.Repository.RegionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
public class RegionController {

    private final RegionRepository regionRepository;
    private final RegionMapper regionMapper;

    public RegionController(
            RegionRepository regionRepository,
            RegionMapper regionMapper
    ) {
        this.regionRepository = regionRepository;
        this.regionMapper = regionMapper;
    }

    @GetMapping
    public List<RegionDto> getRegions() {
        return regionRepository.findAll()
                .stream()
                .map(regionMapper::toDto)
                .toList();
    }
}
