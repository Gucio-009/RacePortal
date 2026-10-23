package pl.raceportal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.User;
import pl.raceportal.repository.EventRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Idempotentny seed „pełnego kalendarza” – dużo APPROVED na torach z {@link TrackCatalog}
 * (mapa / lista / filtry) oraz ARCHIVED do archiwum. Prefiks nazwy {@code [Demo]} ułatwia rozpoznanie.
 */
final class FilledCalendarSeed {

    private static final Logger log = LoggerFactory.getLogger(FilledCalendarSeed.class);
    private static final String DEMO_BANK = "PL61 1090 1014 0000 0712 1981 2874";

    private static final String[] CATEGORIES = {
            "Drift", "Drift trening", "Drift amatorskie", "Drift pro",
            "GT Racing", "Endurance", "Time Attack", "Track Day", "Racing", "MPWS",
            "Sprint", "Drag race", "Rallycross", "Wrak race", "Wyścigi górskie",
            "Rajdy", "KJS", "RallySprint", "SuperOES", "RSMP", "SKJS",
    };

    private static final String[] TIMES = {
            "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
            "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "19:30", "20:00",
    };

    private static final String[] IMAGES = {
            "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1617130644016-d318045a3958?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=960&q=70&fm=webp",
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=960&q=70&fm=webp",
    };

    private static final List<BigDecimal> FEES = List.of(
            new BigDecimal("150.00"),
            new BigDecimal("250.00"),
            new BigDecimal("320.00"),
            new BigDecimal("450.00"),
            new BigDecimal("650.00"),
            new BigDecimal("890.00"),
            new BigDecimal("1200.00")
    );

    private FilledCalendarSeed() {
    }

    static void ensure(EventRepository eventRepository, User organizer) {
        int upserted = 0;

        // Nadchodzące / przyszłe: ~co 4 dni, Oct 2026 → Dec 2027 (różne tory i kategorie).
        LocalDate day = LocalDate.of(2026, 10, 24);
        LocalDate end = LocalDate.of(2027, 12, 31);
        int i = 0;
        while (!day.isAfter(end)) {
            TrackCatalog.Entry track = TrackCatalog.ALL[i % TrackCatalog.ALL.length];
            String category = CATEGORIES[i % CATEGORIES.length];
            String name = "[Demo] " + day + " · " + category + " · " + track.name();
            boolean paid = i % 4 == 0;
            upsert(eventRepository, organizer, name,
                    description(category, track, paid),
                    category, day, TIMES[i % TIMES.length], track,
                    IMAGES[i % IMAGES.length], EventStatus.APPROVED, paid,
                    paid ? FEES.get((i / 4) % FEES.size()) : null);
            upserted++;
            day = day.plusDays(4);
            i++;
        }

        // Archiwum: przeszłe rundy 2026 (sty–wrz), co ~9 dni.
        LocalDate past = LocalDate.of(2026, 1, 12);
        LocalDate pastEnd = LocalDate.of(2026, 10, 1);
        int p = 0;
        while (past.isBefore(pastEnd)) {
            TrackCatalog.Entry track = TrackCatalog.ALL[(p * 3) % TrackCatalog.ALL.length];
            String category = CATEGORIES[(p * 2) % CATEGORIES.length];
            String name = "[Demo archiwum] " + past + " · " + category + " · " + track.name();
            upsert(eventRepository, organizer, name,
                    "Archiwalna runda demo – " + category + " na torze " + track.name() + ".",
                    category, past, TIMES[p % TIMES.length], track,
                    IMAGES[p % IMAGES.length], EventStatus.ARCHIVED, false, null);
            upserted++;
            past = past.plusDays(9);
            p++;
        }

        log.info("Filled calendar seed ensured ({} demo events upserted)", upserted);
    }

    private static String description(String category, TrackCatalog.Entry track, boolean paid) {
        String base = "Impreza demo kategorii " + category + " na obiekcie " + track.name()
                + " (" + track.city() + ", " + track.voivodeship() + "). "
                + "Sesje, briefing i otwarte zgłoszenia – dane wypełniają kalendarz i mapę.";
        return paid
                ? base + " Wpisowe płatne przelewem; potwierdzenie wymagane w zgłoszeniu."
                : base + " Wstęp i zgłoszenie bez wpisowego.";
    }

    private static void upsert(EventRepository eventRepository, User organizer, String name,
                                String description, String category, LocalDate date, String time,
                                TrackCatalog.Entry track, String imageUrl, EventStatus status,
                                boolean paid, BigDecimal entryFee) {
        Event event = eventRepository.findFirstByNameIgnoreCase(name).orElseGet(Event::new);
        event.setOrganizer(organizer);
        event.setName(name);
        event.setDescription(description);
        event.setCategory(category);
        event.setDate(date);
        event.setTime(time);
        event.setTrack(track.name());
        event.setCity(track.city());
        event.setVoivodeship(track.voivodeship());
        event.setImageUrl(imageUrl);
        event.setLat(track.lat());
        event.setLng(track.lng());
        event.setStatus(status);
        event.setPaid(paid);
        event.setEntryFee(paid ? entryFee : null);
        event.setBankAccount(paid ? DEMO_BANK : null);
        // Kolumny NOT NULL w schemacie – zawsze ustawiamy wartości domyślne.
        event.setPaymentDeadlineHours(72);
        event.setFreeCancelDays(7);
        event.setAcceptRegistrations(status == EventStatus.APPROVED);
        eventRepository.save(event);
    }
}
