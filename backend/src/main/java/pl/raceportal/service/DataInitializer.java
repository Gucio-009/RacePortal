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
    private static final String DEMO_BANK = "PL61 1090 1014 0000 0712 1981 2874";

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

        if (!userRepository.existsByEmailIgnoreCase("admin@raceportal.pl")) {
            seedFresh();
        } else {
            log.info("Seed skipped: demo users already present");
        }

        // Always keep a visible set of paid demo events (idempotent by name).
        ensurePaidDemoEvents();
        // Always ensure test driver has one car per race category.
        ensureDemoGarageCars();
    }

    private void seedFresh() {
        User admin = createUser("admin@raceportal.pl", "Administrator", "admin123", Role.ADMIN, "admin");
        User organizer = createUser("org@raceportal.pl", "Organizator", "org123", Role.ORGANIZER, "organizer");
        User driver = createUser("test@wp.pl", "test", "test123", Role.USER, "test");

        eventRepository.save(event(organizer, "Mistrzostwa Polski Wyścigów Samochodowych",
                "Główna runda Mistrzostw Polski Wyścigów Samochodowych. Sprinty kwalifikacyjne i wyścig główny na torze Poznań.",
                "MPWS", LocalDate.of(2026, 8, 15), "15:00", "Tor Poznań", "Poznań", "Wielkopolskie",
                "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.3312, 16.8491, EventStatus.APPROVED));

        eventRepository.save(event(organizer, "Poland Racing Festival",
                "Festiwal wyścigowy z klasami touring, historic i open — wstęp i zgłoszenie bez wpisowego.",
                "Racing", LocalDate.of(2026, 9, 26), "13:00", "Autodrom Most", "Most", "Dolnośląskie",
                "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                50.5031, 13.636, EventStatus.APPROVED));

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

        log.info("Seed OK: admin={}, organizer={}, driver={}",
                admin.getEmail(), organizer.getEmail(), driver.getEmail());
    }

    private void ensurePaidDemoEvents() {
        User organizer = userRepository.findByEmailIgnoreCase("org@raceportal.pl").orElse(null);
        if (organizer == null) {
            return;
        }

        upsertPaid(organizer, "Puchar Polski GT Racing",
                "Płatna runda Pucharu Polski GT. Wpisowe obejmuje dwie sesje kwalifikacyjne oraz wyścig 45 minut.",
                "GT Racing", LocalDate.of(2026, 8, 29), "14:00", "Autodrom Pomorze Pszczółki", "Pszczółki", "Pomorskie",
                "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                54.1985, 18.5986, new BigDecimal("890.00"));

        upsertPaid(organizer, "Drift Masters Polish Grand Prix",
                "Polska runda Drift Masters — battle 1v1 i freestyle. Wpisowe płatne przelewem przed startem.",
                "Drift", LocalDate.of(2026, 9, 12), "16:00", "Tor Słomczyn", "Słomczyn", "Mazowieckie",
                "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                52.0376, 20.7589, new BigDecimal("650.00"));

        upsertPaid(organizer, "Runda Rajdowa Rally Sprint Cup",
                "Płatna runda rajdowa — wpisowe płatne przelewem na konto organizatora, potwierdzenie przelewu wymagane w zgłoszeniu.",
                "Rally", LocalDate.of(2026, 9, 5), "09:00", "Ośrodek Rajdowy Radom", "Radom", "Mazowieckie",
                "https://images.unsplash.com/photo-1600661653561-629509216228?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                51.4027, 21.1471, new BigDecimal("450.00"));

        upsertPaid(organizer, "Śląski Wyścig Długodystansowy",
                "4-godzinny endurance z wymianami kierowców. Pakiet startowy obejmuje pitlane i briefing.",
                "Endurance", LocalDate.of(2026, 10, 10), "12:00", "Tor Kamień Śląski", "Kamień Śląski", "Opolskie",
                "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                50.575, 18.083, new BigDecimal("1200.00"));

        upsertPaid(organizer, "Night Street Legal Time Attack",
                "Nocny time attack na zamkniętym torze. Limitowane miejsca — wpisowe potwierdzane przelewem.",
                "Time Attack", LocalDate.of(2026, 10, 17), "19:30", "Tor Kielce", "Kielce", "Świętokrzyskie",
                "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                50.8661, 20.6286, new BigDecimal("320.00"));

        log.info("Paid demo events ensured (paid APPROVED upcoming present)");
    }

    private void upsertPaid(User organizer, String name, String description, String category, LocalDate date,
                             String time, String track, String city, String voivodeship, String imageUrl,
                             double lat, double lng, BigDecimal entryFee) {
        Event event = eventRepository.findFirstByNameIgnoreCase(name).orElseGet(Event::new);
        boolean created = event.getId() == null;
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
        event.setStatus(EventStatus.APPROVED);
        event.setPaid(true);
        event.setEntryFee(entryFee);
        event.setBankAccount(DEMO_BANK);
        event.setPaymentDeadlineHours(72);
        event.setFreeCancelDays(7);
        event.setAcceptRegistrations(true);
        eventRepository.save(event);
        log.info("{} paid event: {}", created ? "Created" : "Updated", name);
    }

    private void ensureDemoGarageCars() {
        User driver = userRepository.findByEmailIgnoreCase("test@wp.pl").orElse(null);
        if (driver == null) {
            return;
        }

        upsertCar(driver, "Nissan", "Silvia S15", 2002, "Drift", "WA D-001",
                "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?w=800");
        upsertCar(driver, "BMW", "M4 GT4", 2023, "GT Racing", "WA GT-02",
                "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800");
        upsertCar(driver, "Subaru", "Impreza WRX STI", 2019, "Rally", "WA R-03",
                "https://images.unsplash.com/photo-1600661653561-629509216228?w=800");
        upsertCar(driver, "Porsche", "911 RSR", 2021, "Endurance", "WA E-04",
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800");
        upsertCar(driver, "Honda", "Civic Type R", 2024, "Time Attack", "WA TA-05",
                "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800");
        upsertCar(driver, "Ford", "Mustang GT", 2022, "Racing", "WA RC-06",
                "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?w=800");
        upsertCar(driver, "Mazda", "MX-5 ND", 2020, "Track Day", "WA TD-07",
                "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?w=800");
        upsertCar(driver, "Toyota", "GR86", 2023, "MPWS", "WA MP-08",
                "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?w=800");

        log.info("Demo garage cars ensured for {}", driver.getEmail());
    }

    private void upsertCar(User owner, String make, String model, int year, String className,
                            String plate, String imageUrl) {
        Car car = carRepository.findFirstByUser_IdAndMakeIgnoreCaseAndModelIgnoreCase(
                        owner.getId(), make, model)
                .orElseGet(Car::new);
        boolean created = car.getId() == null;
        car.setUser(owner);
        car.setMake(make);
        car.setModel(model);
        car.setYear(year);
        car.setClassName(className);
        car.setPlate(plate);
        car.setImageUrl(imageUrl);
        carRepository.save(car);
        log.info("{} demo car: {} {} [{}]", created ? "Created" : "Updated", make, model, className);
    }

    private User createUser(String email, String username, String rawPassword, Role role, String avatarSeed) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + avatarSeed);
        user.setEmailVerified(true);
        return userRepository.save(user);
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
        event.setPaid(false);
        event.setAcceptRegistrations(true);
        return event;
    }
}
