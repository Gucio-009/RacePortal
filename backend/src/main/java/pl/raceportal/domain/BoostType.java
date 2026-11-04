package pl.raceportal.domain;

/**
 * Typ doładowania silnika — używany do przeliczenia pojemności ekwiwalentnej
 * przy auto-przydziale do klas wydarzenia.
 */
public enum BoostType {
    /** Wolnossący / EV / bez doładowania — mnożnik 1.0. */
    NONE,
    /** Turbosprężarka. */
    TURBO,
    /** Kompresor mechaniczny. */
    SUPERCHARGER
}
