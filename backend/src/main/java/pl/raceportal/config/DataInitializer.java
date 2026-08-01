package pl.raceportal.config;

import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
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

@Component
public class DataInitializer implements ApplicationRunner {
  private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

  private final boolean enabled;
  private final UserRepository users;
  private final EventRepository events;
  private final CarRepository cars;
  private final PasswordEncoder encoder;

  public DataInitializer(
      @Value("${app.seed.enabled:true}") boolean enabled,
      UserRepository users,
      EventRepository events,
      CarRepository cars,
      PasswordEncoder encoder) {
    this.enabled = enabled;
    this.users = users;
    this.events = events;
    this.cars = cars;
    this.encoder = encoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!enabled) return;
    if (users.count() > 0) {
      log.info("Seed skipped — users already present");
      return;
    }
    log.info("Seeding demo data…");

    User admin = user("admin@raceportal.pl", "Admin", "admin123", Role.ADMIN);
    User org = user("org@raceportal.pl", "Organizator Demo", "org123", Role.ORGANIZER);
    User driver = user("test@wp.pl", "Kierowca Test", "test123", Role.USER);

    Car car = new Car();
    car.setUser(driver);
    car.setMake("BMW");
    car.setModel("E36");
    car.setYear(1995);
    car.setClassName("Street");
    car.setPlate("PO TEST1");
    cars.save(car);

    LocalDate base = LocalDate.now().plusMonths(1).withDayOfMonth(15);
    events.save(event("Track Day Poznań", "Dzień torowy na Torze Poznań.", "Track Day",
        base, "09:00", "Tor Poznań", "Poznań", "wielkopolskie",
        52.4215, 16.8260, EventStatus.APPROVED, org));
    events.save(event("Drift Night Łódź", "Nocny drift na Autodromie.", "Drift",
        base.plusWeeks(3), "18:00", "Autodrom Łódź", "Łódź", "łódzkie",
        51.7592, 19.4560, EventStatus.APPROVED, org));
    events.save(event("Time Attack Kraków", "Czasówka na torze.", "Time Attack",
        base.plusMonths(2), "10:00", "Tor Kraków", "Kraków", "małopolskie",
        50.0647, 19.9450, EventStatus.APPROVED, org));
    events.save(event("KJS Warm-up", "Oczekuje na moderację admina.", "KJS",
        base.plusWeeks(1), "08:00", "Odcinek testowy", "Gniezno", "wielkopolskie",
        52.5347, 17.5826, EventStatus.PENDING, org));
    events.save(event("Sezon otwarty 2025", "Archiwalne wydarzenie demo.", "Track Day",
        LocalDate.now().minusMonths(2), "09:00", "Tor Poznań", "Poznań", "wielkopolskie",
        52.4215, 16.8260, EventStatus.ARCHIVED, org));

    log.info("Seed ready: {}, {}, {}", admin.getEmail(), org.getEmail(), driver.getEmail());
  }

  private User user(String email, String username, String password, Role role) {
    User u = new User();
    u.setEmail(email);
    u.setUsername(username);
    u.setPasswordHash(encoder.encode(password));
    u.setRole(role);
    u.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + email);
    return users.save(u);
  }

  private Event event(
      String name, String description, String category, LocalDate date, String time,
      String track, String city, String voivodeship, Double lat, Double lng,
      EventStatus status, User organizer) {
    Event e = new Event();
    e.setName(name);
    e.setDescription(description);
    e.setCategory(category);
    e.setDate(date);
    e.setTime(time);
    e.setTrack(track);
    e.setCity(city);
    e.setVoivodeship(voivodeship);
    e.setLat(lat);
    e.setLng(lng);
    e.setStatus(status);
    e.setOrganizer(organizer);
    e.setImageUrl("https://images.unsplash.com/photo-1638909469623-4fdd7758414b?w=1080");
    return e;
  }
}
