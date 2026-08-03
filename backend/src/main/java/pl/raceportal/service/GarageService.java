package pl.raceportal.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.Car;
import pl.raceportal.domain.RegistrationStatus;
import pl.raceportal.domain.User;
import pl.raceportal.dto.GarageDtos.CarCreateRequest;
import pl.raceportal.dto.GarageDtos.CarResponse;
import pl.raceportal.dto.GarageDtos.CarUpdateRequest;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.web.ApiException;

import java.util.List;
import java.util.Objects;

@Service
public class GarageService {

    private static final List<RegistrationStatus> OPEN_STATUSES =
            List.of(RegistrationStatus.PENDING, RegistrationStatus.ACCEPTED, RegistrationStatus.CONFIRMED);

    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;

    public GarageService(CarRepository carRepository, UserRepository userRepository,
                          RegistrationRepository registrationRepository) {
        this.carRepository = carRepository;
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<CarResponse> list(String userId) {
        return carRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::serialize)
                .toList();
    }

    @Transactional
    public CarResponse create(String userId, CarCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));

        Car car = new Car();
        car.setUser(user);
        car.setMake(request.make());
        car.setModel(request.model());
        car.setYear(request.year());
        car.setClassName(request.className());
        car.setPlate(request.plate());
        car.setImageUrl((request.imageUrl() == null || request.imageUrl().isBlank()) ? null : request.imageUrl());
        applyCarFields(car, request);

        car = carRepository.save(car);
        return serialize(car);
    }

    /**
     * Diagram "Proces edytowania auta z garażu": changes that would affect an
     * open registration (make/model/class) are refused outright while the car
     * has a PENDING/ACCEPTED/CONFIRMED registration attached.
     */
    @Transactional
    public CarResponse update(String userId, String carId, CarUpdateRequest request) {
        Car car = carRepository.findByIdAndUser_Id(carId, userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono auta"));

        boolean hasOpenRegistration = registrationRepository.existsByCar_IdAndStatusIn(carId, OPEN_STATUSES);
        boolean changesConflict = hasOpenRegistration && (
                (request.make() != null && !Objects.equals(request.make(), car.getMake())) ||
                        (request.model() != null && !Objects.equals(request.model(), car.getModel())) ||
                        (request.className() != null && !Objects.equals(request.className(), car.getClassName())));

        if (changesConflict) {
            throw ApiException.badRequest(
                    "Brak możliwości edycji auta ze względu na otwarte zgłoszenie");
        }

        if (request.make() != null) car.setMake(request.make());
        if (request.model() != null) car.setModel(request.model());
        if (request.year() != null) car.setYear(request.year());
        if (request.className() != null) car.setClassName(request.className());
        if (request.plate() != null) car.setPlate(request.plate());
        if (request.imageUrl() != null) car.setImageUrl(request.imageUrl().isBlank() ? null : request.imageUrl());
        applyCarUpdateFields(car, request);

        car = carRepository.save(car);
        return serialize(car);
    }

    /** Diagram "Proces usuwania auta z garażu": any open registration blocks deletion entirely. */
    @Transactional
    public void delete(String userId, String carId) {
        Car car = carRepository.findByIdAndUser_Id(carId, userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono auta"));

        if (registrationRepository.existsByCar_IdAndStatusIn(carId, OPEN_STATUSES)) {
            throw ApiException.badRequest(
                    "Brak możliwości usunięcia auta ze względu na otwarte zgłoszenie");
        }

        carRepository.delete(car);
    }

    CarResponse serialize(Car car) {
        return new CarResponse(
                car.getId(),
                car.getUser().getId(),
                car.getMake(),
                car.getModel(),
                car.getYear(),
                car.getClassName(),
                car.getPlate(),
                car.getImageUrl(),
                car.getDriveType(),
                car.getPowerHp(),
                car.getEngineCc(),
                car.getWeightKg(),
                car.isRegistered(),
                car.getRegistrationType(),
                car.getKssNumber(),
                car.isHasRollCage(),
                car.isHasOc(),
                car.isHasPt(),
                car.getSocialUrl(),
                car.getVideoUrl(),
                car.getModifications(),
                car.getCreatedAt().toString(),
                car.getUpdatedAt().toString()
        );
    }

    private void applyCarFields(Car car, CarCreateRequest request) {
        car.setDriveType(blankToNull(request.driveType()));
        car.setPowerHp(request.powerHp());
        car.setEngineCc(request.engineCc());
        car.setWeightKg(request.weightKg());
        if (request.registered() != null) car.setRegistered(request.registered());
        car.setRegistrationType(blankToNull(request.registrationType()));
        car.setKssNumber(blankToNull(request.kssNumber()));
        if (request.hasRollCage() != null) car.setHasRollCage(request.hasRollCage());
        if (request.hasOc() != null) car.setHasOc(request.hasOc());
        if (request.hasPt() != null) car.setHasPt(request.hasPt());
        car.setSocialUrl(blankToNull(request.socialUrl()));
        car.setVideoUrl(blankToNull(request.videoUrl()));
        car.setModifications(blankToNull(request.modifications()));
    }

    private void applyCarUpdateFields(Car car, CarUpdateRequest request) {
        if (request.driveType() != null) car.setDriveType(blankToNull(request.driveType()));
        if (request.powerHp() != null) car.setPowerHp(request.powerHp());
        if (request.engineCc() != null) car.setEngineCc(request.engineCc());
        if (request.weightKg() != null) car.setWeightKg(request.weightKg());
        if (request.registered() != null) car.setRegistered(request.registered());
        if (request.registrationType() != null) car.setRegistrationType(blankToNull(request.registrationType()));
        if (request.kssNumber() != null) car.setKssNumber(blankToNull(request.kssNumber()));
        if (request.hasRollCage() != null) car.setHasRollCage(request.hasRollCage());
        if (request.hasOc() != null) car.setHasOc(request.hasOc());
        if (request.hasPt() != null) car.setHasPt(request.hasPt());
        if (request.socialUrl() != null) car.setSocialUrl(blankToNull(request.socialUrl()));
        if (request.videoUrl() != null) car.setVideoUrl(blankToNull(request.videoUrl()));
        if (request.modifications() != null) car.setModifications(blankToNull(request.modifications()));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
