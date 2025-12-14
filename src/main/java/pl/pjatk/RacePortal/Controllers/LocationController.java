package pl.pjatk.RacePortal.Controllers;

import pl.pjatk.RacePortal.Dto.LocationDto;
import pl.pjatk.RacePortal.mapper.LocationMapper;
import pl.pjatk.RacePortal.Repository.LocationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
