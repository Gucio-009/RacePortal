package pl.raceportal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.EventStatus;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Seeds demo users, cars and events so the app is usable right after startup. */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedEnabled;

    public DataInitializer(UserRepository userRepository, CarRepository carRepository,
                            EventRepository eventRepository, PasswordEncoder passwordEncoder,
                            @Value("${app.seed.enabled:true}") boolean seedEnabled) {
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedEnabled = seedEnabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }
        if (userRepository.existsByEmailIgnoreCase("admin@raceportal.pl")) {
            log.info("Seed skipped: demo data already present");
            return;
        }

        User admin = createUser("admin@raceportal.pl", "Administrator", "admin123", Role.ADMIN, "admin");
        User organizer = createUser("org@raceportal.pl", "Organizator", "org123", Role.ORGANIZER, "organizer");
        User driver = createUser("test@wp.pl", "test", "test123", Role.USER, "test");

        carRepository.save(car(driver, "BMW", "M2", 2022, "GT4", "WA 12345",
                "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800"));
        carRepository.save(car(driver, "Porsche", "911 GT3", 2021, "Cup", "GDA 98765",
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"));

        eventRepository.save(event(organizer, "Mistrzostwa Polski Wyścigów Samochodowych",
                "Główna runda Mistrzostw Polski Wyścigów Samochodowych. Sprinty kwalifikacyjne i wyścig główny na torze Poznań.",
                "MPWS", LocalDate.of(2026, 8, 15), "15:00", "Tor Poznań", "Poznań", "Wielkopolskie",
                "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.3312, 16.8491, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Puchar Polski GT Racing",
                "Puchar Polski dla samochodów GT. Dwie sesje kwalifikacyjne oraz wyścig 45 minut.",
                "GT Racing", LocalDate.of(2026, 8, 29), "14:00", "Autodrom Pomorze Pszczółki", "Pszczółki", "Pomorskie",
                "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                54.1985, 18.5986, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Drift Masters Polish Grand Prix",
                "Polska runda Drift Masters. Battle 1v1 i freestyle show po finale.",
                "Drift", LocalDate.of(2026, 9, 12), "16:00", "Tor Słomczyn", "Słomczyn", "Mazowieckie",
                "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.0376, 20.7589, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Poland Racing Festival",
                "Festiwal wyścigowy z klasami touring, historic i open.",
                "Racing", LocalDate.of(2026, 9, 26), "13:00", "Autodrom Most", "Most", "Dolnośląskie",
                "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                50.5031, 13.636, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Śląski Wyścig Długodystansowy",
                "4-godzinny endurance z wymianami kierowców.",
                "Endurance", LocalDate.of(2026, 10, 10), "12:00", "Tor Kamień Śląski", "Kamień Śląski", "Opolskie",
                "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                50.575, 18.083, EventStatus.APPROVED));

        eventRepository.save(paidEvent(organizer, "Runda Rajdowa Rally Sprint Cup",
                "Płatna runda rajdowa — wpisowe płatne przelewem na konto organizatora, potwierdzenie przelewu " +
                        "wymagane w zgłoszeniu.",
                "Rally", LocalDate.of(2026, 9, 5), "09:00", "Ośrodek Rajdowy Radom", "Radom", "Mazowieckie",
                "https://images.unsplash.com/photo-1600661653561-629509216228?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                51.4027, 21.1471, EventStatus.APPROVED,
                new BigDecimal("450.00"), "PL61 1090 1014 0000 0712 1981 2874"));

        eventRepository.save(event(organizer, "Mazowieckie Mistrzostwa Trackday",
                "Track day z sesjami open pitlane oraz opcjonalnymi pomiarami czasu.",
                "Track Day", LocalDate.of(2026, 10, 24), "10:00", "Tor Ułęż", "Ułęż", "Lubelskie",
                "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                51.627, 22.108, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Nocny Drift Cup (oczekuje)",
                "Nocna runda driftowa — wniosek organizatora oczekuje na akceptację admina.",
                "Drift", LocalDate.of(2026, 11, 7), "20:00", "Tor Słomczyn", "Słomczyn", "Mazowieckie",
                "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.0376, 20.7589, EventStatus.PENDING));

        eventRepository.save(event(organizer, "Warszawski Drift Classic",
                "Archiwalna runda driftowa sezonu.",
                "Drift", LocalDate.of(2026, 3, 24), "15:00", "Tor Słomczyn", "Słomczyn", "Mazowieckie",
                "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.0376, 20.7589, EventStatus.ARCHIVED));

        log.info("Seed OK: admin={}, organizer={}, driver={}, events={}",
                admin.getEmail(), organizer.getEmail(), driver.getEmail(), eventRepository.count());
    }

    private User createUser(String email, String username, String rawPassword, Role role, String avatarSeed) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + avatarSeed);
        return userRepository.save(user);
    }

    private Car car(User owner, String make, String model, int year, String className, String plate, String imageUrl) {
        Car car = new Car();
        car.setUser(owner);
        car.setMake(make);
        car.setModel(model);
        car.setYear(year);
        car.setClassName(className);
        car.setPlate(plate);
        car.setImageUrl(imageUrl);
        return car;
    }

    private Event event(User organizer, String name, String description, String category, LocalDate date,
                         String time, String track, String city, String voivodeship, String imageUrl,
                         double lat, double lng, EventStatus status) {
        Event event = new Event();
        event.setOrganizer(organizer);
        event.setName(name);
        event.setDescription(description);
        event.setCategory(category);
        event.setDate(date);
        event.setTime(time);
        event.setTrack(track);
        event.setCity(city);
        event.setVoivodeship(voivodeship);
        event.setImageUrl(imageUrl);
        event.setLat(lat);
        event.setLng(lng);
        event.setStatus(status);
        return event;
    }

    private Event paidEvent(User organizer, String name, String description, String category, LocalDate date,
                             String time, String track, String city, String voivodeship, String imageUrl,
                             double lat, double lng, EventStatus status, BigDecimal entryFee, String bankAccount) {
        Event event = event(organizer, name, description, category, date, time, track, city, voivodeship,
                imageUrl, lat, lng, status);
        event.setPaid(true);
        event.setEntryFee(entryFee);
        event.setBankAccount(bankAccount);
        return event;
    }
}
