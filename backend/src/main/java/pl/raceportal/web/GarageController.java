package pl.raceportal.web;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.raceportal.security.AuthSupport;
import pl.raceportal.service.GarageService;
import pl.raceportal.web.dto.GarageDtos;

@RestController
@RequestMapping("/api/garage")
public class GarageController {
  private final GarageService garage;

  public GarageController(GarageService garage) {
    this.garage = garage;
  }

  @GetMapping
  public List<GarageDtos.CarResponse> list() {
    return garage.list(AuthSupport.requireUser());
  }

  @PostMapping
  public GarageDtos.CarResponse create(@Valid @RequestBody GarageDtos.CreateCarRequest req) {
    return garage.create(req, AuthSupport.requireUser());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    garage.delete(id, AuthSupport.requireUser());
  }
}
