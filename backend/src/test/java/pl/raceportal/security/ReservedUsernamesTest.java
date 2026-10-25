package pl.raceportal.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReservedUsernamesTest {

    @Test
    void blocksOrganizerAndAdminVariants() {
        assertTrue(ReservedUsernames.isReserved("Organizator"));
        assertTrue(ReservedUsernames.isReserved("organizator"));
        assertTrue(ReservedUsernames.isReserved("Orga nizator"));
        assertTrue(ReservedUsernames.isReserved("Administrator"));
        assertTrue(ReservedUsernames.isReserved("admin"));
        assertTrue(ReservedUsernames.isReserved("RacePortal"));
    }

    @Test
    void allowsOrdinaryDisplayNames() {
        assertFalse(ReservedUsernames.isReserved("Kierowca42"));
        assertFalse(ReservedUsernames.isReserved("test"));
        assertFalse(ReservedUsernames.isReserved("OrgTrackDay"));
        assertFalse(ReservedUsernames.isReserved(null));
        assertFalse(ReservedUsernames.isReserved("  "));
    }
}
