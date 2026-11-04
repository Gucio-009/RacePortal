package pl.raceportal.service;

import pl.raceportal.domain.BoostType;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.EventClass;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Dopasowanie pojazdu do pierwszej pasującej klasy wydarzenia (wg {@code sortOrder}).
 * Pojemność porównujemy do obliczeniowej: nominal × mnożnik typu doładowania.
 */
public final class ClassAssigner {

    private ClassAssigner() {
    }

    /**
     * Zwraca pierwszą pasującą klasę albo {@code null} gdy brak reguł / brak auta / brak matcha.
     */
    public static EventClass assign(Car car, List<EventClass> classesOrdered) {
        if (car == null || classesOrdered == null || classesOrdered.isEmpty()) {
            return null;
        }
        for (EventClass clazz : classesOrdered) {
            if (matches(car, clazz)) {
                return clazz;
            }
        }
        return null;
    }

    public static boolean matches(Car car, EventClass clazz) {
        if (car == null || clazz == null) {
            return false;
        }

        if (clazz.getMinEngineCc() != null || clazz.getMaxEngineCc() != null) {
            Integer calculated = calculatedEngineCc(car, clazz);
            if (calculated == null) {
                return false;
            }
            if (clazz.getMinEngineCc() != null && calculated < clazz.getMinEngineCc()) {
                return false;
            }
            if (clazz.getMaxEngineCc() != null && calculated > clazz.getMaxEngineCc()) {
                return false;
            }
        }

        if (clazz.getAllowedDriveTypes() != null && !clazz.getAllowedDriveTypes().isBlank()) {
            String carDrive = normalizeDrive(car.getDriveType());
            if (carDrive == null) {
                return false;
            }
            Set<String> allowed = parseDriveCsv(clazz.getAllowedDriveTypes());
            if (!allowed.contains(carDrive)) {
                return false;
            }
        }

        if (Boolean.TRUE.equals(clazz.getRequireCage()) && !car.isHasRollCage()) {
            return false;
        }
        if (Boolean.TRUE.equals(clazz.getRequireRegistered()) && !car.isRegistered()) {
            return false;
        }

        if (clazz.getAllowedTireTypes() != null && !clazz.getAllowedTireTypes().isBlank()) {
            var allowed = Set.copyOf(TireTypes.parse(clazz.getAllowedTireTypes()));
            var carTires = TireTypes.parse(car.getTireTypes());
            boolean any = carTires.stream().anyMatch(allowed::contains);
            if (!any) {
                return false;
            }
        }

        if (clazz.getMaxHpPerTonne() != null) {
            if (car.getPowerHp() == null || car.getWeightKg() == null || car.getWeightKg() <= 0) {
                return false;
            }
            BigDecimal hpPerT = BigDecimal.valueOf(car.getPowerHp())
                    .multiply(BigDecimal.valueOf(1000))
                    .divide(BigDecimal.valueOf(car.getWeightKg()), 4, RoundingMode.HALF_UP);
            if (hpPerT.compareTo(clazz.getMaxHpPerTonne()) > 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Pojemność obliczeniowa dla danego auta i klasy (mnożniki z klasy).
     * {@code null} gdy brak nominalnej pojemności.
     */
    public static Integer calculatedEngineCc(Car car, EventClass clazz) {
        if (car == null || car.getEngineCc() == null) {
            return null;
        }
        BigDecimal multiplier = multiplierFor(car.getBoostType(), clazz);
        return BigDecimal.valueOf(car.getEngineCc())
                .multiply(multiplier)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    public static BigDecimal multiplierFor(BoostType boostType, EventClass clazz) {
        BoostType type = boostType != null ? boostType : BoostType.NONE;
        return switch (type) {
            case TURBO -> clazz != null && clazz.getTurboMultiplier() != null
                    ? clazz.getTurboMultiplier()
                    : BigDecimal.ONE;
            case SUPERCHARGER -> clazz != null && clazz.getSuperchargerMultiplier() != null
                    ? clazz.getSuperchargerMultiplier()
                    : BigDecimal.ONE;
            case NONE -> BigDecimal.ONE;
        };
    }

    private static Set<String> parseDriveCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        java.util.LinkedHashSet<String> out = new java.util.LinkedHashSet<>();
        for (String part : csv.split(",")) {
            String n = normalizeDrive(part);
            if (n != null) {
                out.add(n);
            }
        }
        return out;
    }

    /** FWD / RWD / AWD (4WD → AWD). */
    private static String normalizeDrive(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if ("4WD".equals(v) || "4X4".equals(v)) {
            return "AWD";
        }
        if ("FWD".equals(v) || "RWD".equals(v) || "AWD".equals(v)) {
            return v;
        }
        return v;
    }
}
