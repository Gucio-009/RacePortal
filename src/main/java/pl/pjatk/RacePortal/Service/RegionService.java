package pl.pjatk.RacePortal.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.pjatk.RacePortal.Dto.RegionDto;
import pl.pjatk.RacePortal.mapper.RegionMapper;
import pl.pjatk.RacePortal.Repository.RegionRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;
    private final RegionMapper regionMapper;

    public List<RegionDto> getAllRegions() {
        return regionRepository.findAll()
                .stream()
                .map(regionMapper::toDto)
                .toList();
    }
}
