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

/** Marks past APPROVED events as ARCHIVED so listings stay clean, on startup and daily. */
@Service
public class ArchiveService {

    private static final Logger log = LoggerFactory.getLogger(ArchiveService.class);

    private final EventRepository eventRepository;

    public ArchiveService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        archivePastEvents();
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void onSchedule() {
        archivePastEvents();
    }

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
