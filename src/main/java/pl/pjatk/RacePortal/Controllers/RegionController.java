package pl.pjatk.RacePortal.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.pjatk.RacePortal.Dto.RegionDto;
import pl.pjatk.RacePortal.Service.RegionService;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public List<RegionDto> getRegions() {
        return regionService.getAllRegions();
    }
}
