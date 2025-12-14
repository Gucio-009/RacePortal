package pl.pjatk.RacePortal.Dto;

import lombok.Data;

@Data
public class LocationDto {

    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private RegionDto region;

    // getters & setters
}
