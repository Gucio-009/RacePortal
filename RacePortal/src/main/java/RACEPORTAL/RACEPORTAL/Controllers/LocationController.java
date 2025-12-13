package RACEPORTAL.RACEPORTAL.Controllers;

import RACEPORTAL.RACEPORTAL.Dto.LocationDto;
import RACEPORTAL.RACEPORTAL.Mapper.LocationMapper;
import RACEPORTAL.RACEPORTAL.Repository.LocationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;

    public LocationController(
            LocationRepository locationRepository,
            LocationMapper locationMapper
    ) {
        this.locationRepository = locationRepository;
        this.locationMapper = locationMapper;
    }

    @GetMapping
    public List<LocationDto> getLocations() {
        return locationRepository.findAll()
                .stream()
                .map(locationMapper::toDto)
                .toList();
    }
}
