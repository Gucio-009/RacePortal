package pl.raceportal.dto;

import java.util.List;

public final class StartListDtos {

    private StartListDtos() {
    }

    public record StartListEntry(
            String registrationId,
            Integer startNumber,
            String driverName,
            String carLabel,
            String classId,
            String className
    ) {
    }

    public record StartListResponse(
            String eventId,
            List<StartListEntry> items
    ) {
    }
}
