package pl.raceportal.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.User;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.UserPrincipal;
import pl.raceportal.web.ApiException;
import pl.raceportal.web.dto.GarageDtos;

@Service
public class GarageService {
  private final CarRepository cars;
  private final UserRepository users;

  public GarageService(CarRepository cars, UserRepository users) {
    this.cars = cars;
    this.users = users;
  }

  @Transactional(readOnly = true)
  public List<GarageDtos.CarResponse> list(UserPrincipal principal) {
    return cars.findByUser_IdOrderByCreatedAtDesc(principal.getId()).stream().map(this::toDto).toList();
  }

  @Transactional
  public GarageDtos.CarResponse create(GarageDtos.CreateCarRequest req, UserPrincipal principal) {
    User user = users.findById(principal.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie"));
    Car car = new Car();
    car.setUser(user);
    car.setMake(req.make());
    car.setModel(req.model());
    car.setYear(req.year());
    car.setClassName(req.className());
    car.setPlate(req.plate());
    car.setImageUrl(req.imageUrl());
    cars.save(car);
    return toDto(car);
  }

  @Transactional
  public void delete(String id, UserPrincipal principal) {
    Car car = cars.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nie znaleziono auta"));
    if (!car.getUser().getId().equals(principal.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Brak uprawnień");
    }
    cars.delete(car);
  }

  private GarageDtos.CarResponse toDto(Car car) {
    return new GarageDtos.CarResponse(
        car.getId(),
        car.getUser().getId(),
        car.getMake(),
        car.getModel(),
        car.getYear(),
        car.getClassName(),
        car.getPlate(),
        car.getImageUrl(),
        car.getCreatedAt().toString(),
        car.getUpdatedAt().toString());
  }
}
