package pl.raceportal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.repository.EventRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Automatyczna archiwizacja minionych wydarzeń APPROVED → ARCHIVED.
 * <p>
 * Rola w architekturze: utrzymanie czystości list publicznych — uruchamiane
 * przy starcie aplikacji oraz codziennie o północy (cron). Czyści cache {@code events}.
 * Technologie: Spring Scheduling, Spring Cache, JPA, transakcje.
 * </p>
 * Reguła: wydarzenie APPROVED z {@code date} przed dzisiejszą datą → ARCHIVED.
 * <p>
 * Pomysł (alt): job w Quartz / Kubernetes CronJob; zapytanie SQL UPDATE zamiast
 * ładowania wszystkich wydarzeń do pamięci.
 * </p>
 */
@Service
public class ArchiveService {

    private static final Logger log = LoggerFactory.getLogger(ArchiveService.class);

    private final EventRepository eventRepository;

    public ArchiveService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /** Archiwizacja zaraz po starcie kontekstu Spring. */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        archivePastEvents();
    }

    /** Codzienny job o 00:00. */
    @Scheduled(cron = "0 0 0 * * *")
    public void onSchedule() {
        archivePastEvents();
    }

    /**
     * Znajduje APPROVED z datą w przeszłości, ustawia ARCHIVED, invaliduje cache listy.
     *
     * @return liczba zarchiwizowanych wydarzeń
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public int archivePastEvents() {
        LocalDate startOfToday = LocalDate.now();
        List<Event> stale = eventRepository.findAll().stream()
                .filter(e -> e.getStatus() == EventStatus.APPROVED && e.getDate().isBefore(startOfToday))
                .toList();

        stale.forEach(e -> e.setStatus(EventStatus.ARCHIVED));
        eventRepository.saveAll(stale);

        if (!stale.isEmpty()) {
            log.info("Auto-archived {} past event(s)", stale.size());
        }
        return stale.size();
    }
}
