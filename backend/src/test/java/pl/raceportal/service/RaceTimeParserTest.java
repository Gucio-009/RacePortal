package pl.raceportal.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RaceTimeParserTest {

    @Test
    void parsesCommonFormats() {
        assertEquals(83456L, RaceTimeParser.parseToMs("1:23.456"));
        assertEquals(83456L, RaceTimeParser.parseToMs("1:23,456"));
        assertEquals(83000L, RaceTimeParser.parseToMs("1:23"));
        assertEquals(3723456L, RaceTimeParser.parseToMs("1:02:03.456"));
        assertEquals(5000L, RaceTimeParser.parseToMs("5"));
        assertNull(RaceTimeParser.parseToMs(""));
        assertNull(RaceTimeParser.parseToMs(null));
    }
}
