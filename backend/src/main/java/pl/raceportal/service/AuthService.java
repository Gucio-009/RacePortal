package pl.raceportal.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AuthDtos.AuthResponse;
import pl.raceportal.dto.AuthDtos.ChangePasswordRequest;
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.dto.AuthDtos.RegisterOrganizerRequest;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.RegisterResponse;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.dto.AuthDtos.UserDto;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.JwtService;
import pl.raceportal.web.ApiException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private static final int VERIFICATION_CODE_TTL_MINUTES = 15;

    private final UserRepository userRepository;
    private final OrganizerApplicationRepository organizerApplicationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;
    private final GoogleIdTokenService googleIdTokenService;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository, OrganizerApplicationRepository organizerApplicationRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService, MailService mailService,
                        GoogleIdTokenService googleIdTokenService) {
        this.userRepository = userRepository;
        this.organizerApplicationRepository = organizerApplicationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.googleIdTokenService = googleIdTokenService;
    }

    /** Diagram "Proces Rejestracji (kierowca/użytkownik)": account is created unverified and a code is mailed. */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        User user = createUnverifiedUser(request.username(), request.email(), request.password(), Role.USER);
        applyProfileFields(user, request.firstName(), request.lastName(), request.phone(),
                request.hasDrivingLicenseB(), request.pzmLicense());
        user = userRepository.save(user);
        sendVerificationCode(user);
        return new RegisterResponse(true, user.getEmail(),
                "Wysłaliśmy 6-cyfrowy kod weryfikacyjny na Twój adres email.");
    }

    /**
     * Diagram "Proces rejestracji (organizator)": account + pending organizer
     * application are created together; the ORGANIZER role is granted only
     * after admin approval of the application (see AdminService), and only
     * once the email has been verified.
     */
    @Transactional
    public RegisterResponse registerOrganizer(RegisterOrganizerRequest request) {
        User user = createUnverifiedUser(request.username(), request.email(), request.password(), Role.USER);

        OrganizerApplication application = new OrganizerApplication();
        application.setUser(user);
        application.setCompany(request.company());
        application.setMessage((request.message() == null || request.message().isBlank())
                ? "Wniosek złożony podczas rejestracji konta organizatora."
                : request.message());
        application.setStatus(ApplicationStatus.PENDING);
        organizerApplicationRepository.save(application);

        sendVerificationCode(user);
        return new RegisterResponse(true, user.getEmail(),
                "Wysłaliśmy 6-cyfrowy kod weryfikacyjny na Twój adres email. Po weryfikacji Twój wniosek o konto " +
                        "organizatora oczekuje na akceptację administratora.");
    }

    /** POST /api/auth/verify-email: confirms the code and issues a JWT, same as login. */
    @Transactional
    public AuthResponse verifyEmail(String email, String code) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.badRequest("Nieprawidłowy email lub kod"));

        if (!user.isEmailVerified()) {
            if (user.getEmailVerificationCode() == null || user.getEmailVerificationExpires() == null
                    || !user.getEmailVerificationCode().equals(code)
                    || Instant.now().isAfter(user.getEmailVerificationExpires())) {
                throw ApiException.badRequest("Nieprawidłowy lub wygasły kod weryfikacyjny");
            }
            user.setEmailVerified(true);
            user.setEmailVerificationCode(null);
            user.setEmailVerificationExpires(null);
            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toUserDto(user));
    }

    /** POST /api/auth/resend-code: soft-fails like forgot-password to avoid leaking which emails exist. */
    @Transactional
    public void resendCode(String email) {
        userRepository.findByEmailIgnoreCase(email)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::sendVerificationCode);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Nieprawidłowy email lub hasło"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Nieprawidłowy email lub hasło");
        }

        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Zweryfikuj adres email przed zalogowaniem — sprawdź skrzynkę pocztową lub poproś o nowy kod.");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toUserDto(user));
    }

    public boolean isGoogleOAuthEnabled() {
        return googleIdTokenService.isConfigured();
    }

    /**
     * Google Sign-In: weryfikacja ID tokenu, find-or-create użytkownika (email już verified przez Google),
     * wydanie JWT RacePortal. Hasło lokalne to losowy hash — logowanie hasłem wymaga resetu/ustawienia.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        var payload = googleIdTokenService.verify(idToken);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setUsername(uniqueUsernameFrom(email, name));
            user.setPasswordHash(passwordEncoder.encode("oauth-google-" + java.util.UUID.randomUUID()));
            user.setRole(Role.USER);
            user.setEmailVerified(true);
            user.setAvatar(picture != null && !picture.isBlank()
                    ? picture
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                    URLEncoder.encode(email, StandardCharsets.UTF_8));
            if (givenName != null) user.setFirstName(givenName);
            if (familyName != null) user.setLastName(familyName);
            user = userRepository.save(user);
        } else {
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                user.setEmailVerificationCode(null);
                user.setEmailVerificationExpires(null);
            }
            if ((user.getAvatar() == null || user.getAvatar().isBlank()) && picture != null && !picture.isBlank()) {
                user.setAvatar(picture);
            }
            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toUserDto(user));
    }

    private String uniqueUsernameFrom(String email, String name) {
        String base;
        if (name != null && !name.isBlank()) {
            base = name.trim().replaceAll("\\s+", "").replaceAll("[^\\p{L}\\p{N}_-]", "");
        } else {
            base = email.split("@")[0].replaceAll("[^\\p{L}\\p{N}_-]", "");
        }
        if (base.length() < 2) {
            base = "user";
        }
        if (base.length() > 36) {
            base = base.substring(0, 36);
        }
        String candidate = base;
        int n = 0;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            n++;
            String suffix = String.valueOf(n);
            candidate = base.substring(0, Math.min(base.length(), 40 - suffix.length())) + suffix;
            if (n > 1000) {
                return "user" + random.nextInt(1_000_000);
            }
        }
        return candidate;
    }

    @Transactional(readOnly = true)
    public UserDto me(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        return toUserDto(user);
    }

    @Transactional
    public UserDto updateMe(String userId, UpdateMeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (request.username() != null && !request.username().isBlank()) {
            user.setUsername(request.username());
        }
        if (request.avatar() != null && !request.avatar().isBlank()) {
            user.setAvatar(request.avatar());
        }
        applyProfileFields(user, request.firstName(), request.lastName(), request.phone(),
                request.hasDrivingLicenseB(), request.pzmLicense());
        user = userRepository.save(user);
        return toUserDto(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Nieprawidłowe obecne hasło");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user ->
                mailService.send(user.getEmail(), "Reset hasła RACEPORTAL",
                        "<p>Otrzymaliśmy prośbę o reset hasła dla konta " + user.getUsername() + ".</p>" +
                                "<p>W wersji MVP skontaktuj się z administratorem lub zaloguj hasłem testowym.</p>"));
    }

    private User createUnverifiedUser(String username, String rawEmail, String rawPassword, Role role) {
        String email = rawEmail.toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Konto z tym emailem już istnieje");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                URLEncoder.encode(rawEmail, StandardCharsets.UTF_8));
        user.setEmailVerified(false);
        return userRepository.save(user);
    }

    private void sendVerificationCode(User user) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        user.setEmailVerificationCode(code);
        user.setEmailVerificationExpires(Instant.now().plus(VERIFICATION_CODE_TTL_MINUTES, ChronoUnit.MINUTES));
        userRepository.save(user);

        mailService.send(user.getEmail(), "Kod weryfikacyjny RACEPORTAL",
                "<p>Cześć " + user.getUsername() + ",</p>" +
                        "<p>Twój kod weryfikacyjny to: <strong>" + code + "</strong></p>" +
                        "<p>Kod jest ważny przez " + VERIFICATION_CODE_TTL_MINUTES + " minut.</p>");
    }

    private UserDto toUserDto(User user) {
        String memberSince = String.valueOf(user.getCreatedAt().atZone(ZoneOffset.UTC).getYear());
        return new UserDto(user.getId(), user.getEmail(), user.getUsername(),
                user.getRole().name(), user.getAvatar(), memberSince,
                user.getFirstName(), user.getLastName(), user.getPhone(),
                user.isHasDrivingLicenseB(), user.getPzmLicense());
    }

    private void applyProfileFields(User user, String firstName, String lastName, String phone,
                                     Boolean hasDrivingLicenseB, String pzmLicense) {
        if (firstName != null) user.setFirstName(firstName.isBlank() ? null : firstName.trim());
        if (lastName != null) user.setLastName(lastName.isBlank() ? null : lastName.trim());
        if (phone != null) user.setPhone(phone.isBlank() ? null : phone.trim());
        if (hasDrivingLicenseB != null) user.setHasDrivingLicenseB(hasDrivingLicenseB);
        if (pzmLicense != null) user.setPzmLicense(pzmLicense.isBlank() ? null : pzmLicense.trim());
    }
}
