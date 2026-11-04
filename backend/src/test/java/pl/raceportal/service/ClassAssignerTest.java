package pl.raceportal.service;

import org.junit.jupiter.api.Test;
import pl.raceportal.domain.BoostType;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.EventClass;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClassAssignerTest {

    @Test
    void assignsFirstMatchingBySortOrder() {
        Car car = car(1600, BoostType.NONE, "RWD", 200, 1100, true, true, "slick");
        EventClass second = clazz("B", 1, null, null, null, null, "RWD", null, null, null);
        EventClass first = clazz("A", 0, null, null, null, null, "RWD", null, null, null);
        assertEquals("A", ClassAssigner.assign(car, List.of(first, second)).getName());
    }

    @Test
    void turboMultiplierAppliedAgainstCalculatedCapacity() {
        Car car = car(2000, BoostType.TURBO, "RWD", 300, 1200, true, true, "slick");
        EventClass limited = clazz("do 2500", 0, null, 2500,
                BigDecimal.valueOf(1.7), null, null, null, null, null);
        EventClass open = clazz("Open", 1, null, null, null, null, null, null, null, null);

        assertNull(ClassAssigner.assign(car, List.of(limited)));
        assertEquals("Open", ClassAssigner.assign(car, List.of(limited, open)).getName());
        assertEquals(3400, ClassAssigner.calculatedEngineCc(car, limited));
    }

    @Test
    void naUsesMultiplierOne() {
        Car car = car(2000, BoostType.NONE, "FWD", 150, 1100, false, true, "road");
        EventClass c = clazz("N/A 2L", 0, 1800, 2200, BigDecimal.valueOf(1.7), null, "FWD", null, null, null);
        assertEquals("N/A 2L", ClassAssigner.assign(car, List.of(c)).getName());
        assertEquals(2000, ClassAssigner.calculatedEngineCc(car, c));
    }

    @Test
    void driveAndHpPerTonneAndCage() {
        Car car = car(1600, BoostType.NONE, "AWD", 400, 1000, false, true, "gravel");
        // 400 HP / 1t = 400
        EventClass ok = clazz("AWD", 0, null, null, null, null, "AWD,4WD", true, null, BigDecimal.valueOf(450));
        EventClass tooStrict = clazz("strict", 0, null, null, null, null, "AWD", true, null, BigDecimal.valueOf(350));

        assertTrue(ClassAssigner.matches(car, ok));
        assertNull(ClassAssigner.assign(car, List.of(tooStrict)));
        // missing cage → fail ok which requires cage
        car.setHasRollCage(false);
        assertNull(ClassAssigner.assign(car, List.of(ok)));
    }

    private static Car car(int cc, BoostType boost, String drive, int hp, int kg,
                           boolean cage, boolean registered, String tires) {
        Car c = new Car();
        c.setEngineCc(cc);
        c.setBoostType(boost);
        c.setDriveType(drive);
        c.setPowerHp(hp);
        c.setWeightKg(kg);
        c.setHasRollCage(cage);
        c.setRegistered(registered);
        c.setTireTypes(tires);
        return c;
    }

    private static EventClass clazz(String name, int sort, Integer min, Integer max,
                                    BigDecimal turbo, BigDecimal sc, String drives,
                                    Boolean cage, Boolean registered, BigDecimal maxHpT) {
        EventClass c = new EventClass();
        c.setName(name);
        c.setSortOrder(sort);
        c.setMinEngineCc(min);
        c.setMaxEngineCc(max);
        c.setTurboMultiplier(turbo);
        c.setSuperchargerMultiplier(sc);
        c.setAllowedDriveTypes(drives);
        c.setRequireCage(cage);
        c.setRequireRegistered(registered);
        c.setMaxHpPerTonne(maxHpT);
        return c;
    }
}
