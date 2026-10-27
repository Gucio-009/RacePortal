package pl.raceportal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.raceportal.domain.ApplicationStatus;
import pl.raceportal.domain.Event;
import pl.raceportal.domain.OrganizerApplication;
import pl.raceportal.domain.Role;
import pl.raceportal.domain.User;
import pl.raceportal.dto.AuthDtos.AuthResponse;
import pl.raceportal.dto.AuthDtos.ChangePasswordRequest;
import pl.raceportal.dto.AuthDtos.LoginRequest;
import pl.raceportal.dto.AuthDtos.MessageResponse;
import pl.raceportal.dto.AuthDtos.RegisterOrganizerRequest;
import pl.raceportal.dto.AuthDtos.RegisterRequest;
import pl.raceportal.dto.AuthDtos.RegisterResponse;
import pl.raceportal.dto.AuthDtos.UpdateMeRequest;
import pl.raceportal.dto.AuthDtos.UserDto;
import pl.raceportal.i18n.MailTexts;
import pl.raceportal.repository.BugReportRepository;
import pl.raceportal.repository.CarRepository;
import pl.raceportal.repository.EventRepository;
import pl.raceportal.repository.NotificationRepository;
import pl.raceportal.repository.OrganizerApplicationRepository;
import pl.raceportal.repository.RefreshTokenRepository;
import pl.raceportal.repository.RegistrationRepository;
import pl.raceportal.repository.UserRepository;
import pl.raceportal.security.AttemptRateLimiter;
import pl.raceportal.security.JwtService;
import pl.raceportal.security.ReservedUsernames;
import pl.raceportal.web.ApiException;

import java.util.List;
import java.util.Locale;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

/**
 * Serwis uwierzytelniania i zarządzania kontem użytkownika.
 * <p>
 * Rola w architekturze: rejestracja (kierowca / organizator), weryfikacja e-mail,
 * logowanie lokalne i Google OAuth, profil ({@code /me}), zmiana hasła, forgot-password.
 * Po sukcesie wydaje JWT przez {@link JwtService}.
 * Technologie: Spring Security (BCrypt), JWT, Spring Mail, Google OAuth ID Token, JPA/MySQL.
 * </p>
 * Reguły kluczowe: konto lokalne startuje niezweryfikowane (link aktywacyjny, TTL 60 min);
 * login wymaga {@code emailVerified}; rejestracja organizatora tworzy też wniosek PENDING
 * (rola ORGANIZER dopiero po akceptacji admina); Google – find-or-create, email już verified.
 * <p>
 * Pomysł (alt): Keycloak zamiast własnego auth; Redis do rate-limitu tokenów.
 * </p>
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /**
     * TTL linku aktywacji / potwierdzenia e-maila (minuty). Krótki + jednorazowy (kasowany
     * w {@link #applyVerificationToken}) — token w URL wpada do access logów (pentest #14).
     */
    private static final int VERIFICATION_TOKEN_TTL_MINUTES = 30;

    /** Czas ważności linku resetu hasła (minuty) — krótki TTL (pentest #1). */
    private static final int PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

    /** Ta sama treść przy wolnym i zajętym adresie — bez oracle 409 (pentest #14). */
    private static final String EMAIL_CHANGE_REQUEST_MESSAGE =
            "Jeśli nowy adres jest dostępny, wysłaliśmy na niego link potwierdzający. "
                    + "Na dotychczasowy adres poszło powiadomienie o prośbie zmiany.";

    private static final int VERIFY_MAX_ATTEMPTS = 10;
    private static final int RESEND_MAX_ATTEMPTS = 3;
    private static final Duration AUTH_CODE_WINDOW = Duration.ofMinutes(15);

    /** Nieudane logowania na jedno konto (email) w oknie. */
    private static final int LOGIN_MAX_PER_EMAIL = 5;
    /** Nieudane logowania z jednego IP w oknie (password stuffing). */
    private static final int LOGIN_MAX_PER_IP = 20;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    private static final int FORGOT_MAX_PER_IP = 10;

    /** Fraza wymagana przy zamknięciu konta (UI każe przepisać dokładnie to). */
    public static final String CLOSE_ACCOUNT_PHRASE = "zamknij konto";

    private final UserRepository userRepository;
    private final OrganizerApplicationRepository organizerApplicationRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final CarRepository carRepository;
    private final NotificationRepository notificationRepository;
    private final BugReportRepository bugReportRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final MailService mailService;
    private final GoogleIdTokenService googleIdTokenService;
    private final AttemptRateLimiter attemptRateLimiter;
    private final SecureRandom random = new SecureRandom();
    private final String publicBaseUrl;
    /**
     * Hash BCrypt losowego hasła. Logowanie na nieistniejący email liczy {@code matches} wobec niego,
     * żeby czas odpowiedzi był taki sam jak przy złym haśle do istniejącego konta (pentest #5).
     */
    private final String dummyPasswordHash;

    public AuthService(UserRepository userRepository, OrganizerApplicationRepository organizerApplicationRepository,
                        EventRepository eventRepository, RegistrationRepository registrationRepository,
                        CarRepository carRepository, NotificationRepository notificationRepository,
                        BugReportRepository bugReportRepository, RefreshTokenRepository refreshTokenRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService,
                        MailService mailService, GoogleIdTokenService googleIdTokenService,
                        AttemptRateLimiter attemptRateLimiter,
                        @Value("${app.public-base-url:https://raceportal.pl}") String publicBaseUrl) {
        this.userRepository = userRepository;
        this.organizerApplicationRepository = organizerApplicationRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.carRepository = carRepository;
        this.notificationRepository = notificationRepository;
        this.bugReportRepository = bugReportRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.mailService = mailService;
        this.googleIdTokenService = googleIdTokenService;
        this.attemptRateLimiter = attemptRateLimiter;
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
        this.dummyPasswordHash = passwordEncoder.encode(generateVerificationToken());
        log.info("Activation links base URL: {}", this.publicBaseUrl);
        if (this.publicBaseUrl.contains("localhost") || this.publicBaseUrl.contains("127.0.0.1")) {
            log.warn("PUBLIC_BASE_URL wskazuje na localhost – maile aktywacyjne nie zadziałają poza tą maszyną. "
                    + "Na prod ustaw PUBLIC_BASE_URL=https://raceportal.pl i zrestartuj api.");
        }
    }

    /**
     * Rejestracja kierowcy: konto USER niezweryfikowane + mail z linkiem aktywacyjnym.
     * Nie wydaje JWT – klient musi otworzyć link ({@link #verifyEmail}).
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (request.phone() != null && !request.phone().isBlank()) {
            ensurePhoneUnique(normalizePhone(request.phone()), null);
        }
        User user = createUnverifiedUser(request.username(), request.email(), request.password(), Role.USER);
        applyProfileFields(user, request.firstName(), request.lastName(), request.phone(),
                request.hasDrivingLicenseB(), request.pzmLicense(), request.address(), request.instagramUrl());
        user = userRepository.save(user);
        sendVerificationLink(user);
        return new RegisterResponse(true, user.getEmail(),
                "Wysłaliśmy link aktywacyjny na Twój adres e-mail.");
    }

    /**
     * Rejestracja organizatora: konto USER + wniosek {@link ApplicationStatus#PENDING}.
     * Rola ORGANIZER nadawana dopiero po akceptacji admina ({@code AdminService}),
     * po wcześniejszej weryfikacji e-mail.
     */
    @Transactional
    public RegisterResponse registerOrganizer(RegisterOrganizerRequest request) {
        User user = createUnverifiedUser(request.username(), request.email(), request.password(), Role.USER);

        OrganizerApplication application = new OrganizerApplication();
        application.setUser(user);
        application.setCompany(request.company());
        application.setBusinessType(request.businessType());
        application.setMessage((request.message() == null || request.message().isBlank())
                ? "Wniosek złożony podczas rejestracji konta organizatora."
                : request.message());
        application.setStatus(ApplicationStatus.PENDING);
        organizerApplicationRepository.save(application);

        sendVerificationLink(user);
        return new RegisterResponse(true, user.getEmail(),
                "Wysłaliśmy link aktywacyjny na Twój adres e-mail. Po aktywacji Twój wniosek o konto " +
                        "organizatora oczekuje na akceptację administratora.");
    }

    /**
     * Potwierdza token z linku aktywacyjnego (rejestracja lub zmiana e-maila) i wydaje JWT.
     * Ponowne kliknięcie przy już zweryfikowanym koncie bez pending – idempotentnie loguje.
     */
    @Transactional
    public AuthResponse verifyEmail(String email, String rawToken) {
        String token = rawToken == null ? "" : rawToken.trim();
        attemptRateLimiter.check("verify-token:" + token, VERIFY_MAX_ATTEMPTS, AUTH_CODE_WINDOW);

        User user = resolveUserForToken(email, token);
        boolean emailChange = user.getPendingEmail() != null && !user.getPendingEmail().isBlank();
        applyVerificationToken(user, token);
        if (emailChange) {
            refreshTokenService.revokeAllAndBump(user);
        }
        return issueSession(user);
    }

    /**
     * Ponowna wysyłka linku – soft-fail (brak błędu gdy email nie istnieje),
     * żeby nie ujawniać, które adresy są w bazie. Rate-limit po emailu.
     */
    @Transactional
    public void resendCode(String email) {
        attemptRateLimiter.check("resend:" + email.trim().toLowerCase(), RESEND_MAX_ATTEMPTS, AUTH_CODE_WINDOW);
        userRepository.findByEmailIgnoreCase(email)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::sendVerificationLink);
    }

    /**
     * Logowanie email+hasło z limitem nieudanych prób (konto + IP) → 429.
     * Brak konta i złe hasło wykonują ten sam BCrypt ({@code matches} wobec {@link #dummyPasswordHash}
     * albo hasha użytkownika) — {@code ||} nie może pominąć liczenia, bo czas zdradzałby istnienie emaila.
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        String emailNorm = request.email() == null ? "" : request.email().trim().toLowerCase();
        String emailKey = "login:email:" + emailNorm;
        String ipKey = "login:ip:" + (clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim());

        attemptRateLimiter.ensureAllowed(emailKey, LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW);
        attemptRateLimiter.ensureAllowed(ipKey, LOGIN_MAX_PER_IP, LOGIN_WINDOW);

        User user = userRepository.findByEmailIgnoreCase(emailNorm).orElse(null);
        String hash = user == null ? null : user.getPasswordHash();
        if (hash == null || hash.isBlank()) {
            hash = dummyPasswordHash;
        }
        boolean passwordOk = passwordEncoder.matches(request.password(), hash);
        if (user == null || !passwordOk) {
            attemptRateLimiter.record(emailKey, LOGIN_WINDOW);
            attemptRateLimiter.record(ipKey, LOGIN_WINDOW);
            throw ApiException.unauthorized("Nieprawidłowy email lub hasło");
        }

        if (!user.isEmailVerified()) {
            // Nie liczymy jako brute-force hasła — konto istnieje, hasło OK.
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Aktywuj konto linkiem z e-maila przed zalogowaniem – sprawdź skrzynkę lub poproś o nowy link.");
        }

        return issueSession(user);
    }

    public boolean isGoogleOAuthEnabled() {
        return googleIdTokenService.isConfigured();
    }

    /**
     * Google Sign-In: weryfikacja ID tokenu, find-or-create użytkownika (email już verified przez Google),
     * wydanie JWT RacePortal. Hasło lokalne to losowy hash – logowanie hasłem wymaga resetu/ustawienia.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String idToken, String clientIp) {
        String ipKey = "oauth:ip:" + (clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim());
        attemptRateLimiter.ensureAllowed(ipKey, LOGIN_MAX_PER_IP, LOGIN_WINDOW);

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
            user.setGoogleAccount(true);
            // Google nie zbiera prawa jazdy / PZM — wymuszamy krok dokończenia rejestracji.
            user.setRegistrationComplete(false);
            user.setAvatar(picture != null && !picture.isBlank() ? picture : null);
            if (givenName != null) user.setFirstName(givenName);
            if (familyName != null) user.setLastName(familyName);
            user = userRepository.save(user);
        } else {
            // Konto lokalne niezweryfikowane: Google udowadnia skrzynkę – unieważnij hasło
            // atakującego, który zarejestrował email ofiary przed jej pierwszym logowaniem.
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                user.setEmailVerificationCode(null);
                user.setEmailVerificationExpires(null);
                user.setPendingEmail(null);
                user.setPasswordHash(passwordEncoder.encode("oauth-google-" + java.util.UUID.randomUUID()));
                user.setGoogleAccount(true);
            }
            if ((user.getAvatar() == null || user.getAvatar().isBlank()) && picture != null && !picture.isBlank()) {
                user.setAvatar(picture);
            }
            // Backfill starych kont Google + oznacz, że tożsamość idzie przez Google.
            user.setGoogleAccount(true);
            user = userRepository.save(user);
        }

        return issueSession(user);
    }

    /** Generuje unikalny username z nazwy Google lub lokalnej części emaila. */
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
        while (ReservedUsernames.isReserved(candidate)
                || userRepository.existsByUsernameIgnoreCase(candidate)) {
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

    /**
     * Rotacja refresh tokena → nowy access + nowy refresh (stary unieważniony).
     * Reuse starego refresh po rotacji unieważnia wszystkie sesje użytkownika.
     */
    @Transactional
    public AuthResponse refreshSession(String rawRefreshToken) {
        var rotated = refreshTokenService.rotate(rawRefreshToken);
        String access = jwtService.generateToken(rotated.user());
        return new AuthResponse(access, rotated.rawRefresh(), toUserDto(rotated.user()));
    }

    /**
     * Wylogowanie: revoke wszystkie refresh użytkownika + bump tokenVersion
     * (access JWT przestaje działać od razu).
     */
    @Transactional
    public void logout(String userIdOrNull, String rawRefreshToken) {
        User user = null;
        if (userIdOrNull != null && !userIdOrNull.isBlank()) {
            user = userRepository.findById(userIdOrNull).orElse(null);
        }
        if (user == null && rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            user = refreshTokenService.findUserByRaw(rawRefreshToken).orElse(null);
        }
        if (user != null) {
            refreshTokenService.revokeAllAndBump(user);
        } else if (rawRefreshToken != null) {
            refreshTokenService.revokeRaw(rawRefreshToken);
        }
    }

    @Transactional
    public UserDto updateMe(String userId, UpdateMeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (request.username() != null && !request.username().isBlank()) {
            user.setUsername(claimUsername(request.username(), user.getId()));
        }
        if (request.avatar() != null) {
            String avatar = request.avatar().trim();
            user.setAvatar(avatar.isEmpty() ? null : avatar);
        }
        applyProfileFields(user, request.firstName(), request.lastName(), request.phone(),
                request.hasDrivingLicenseB(), request.pzmLicense(), request.address(), request.instagramUrl());
        // Dokończenie rejestracji Google: jawne przesłanie hasDrivingLicenseB zamyka onboarding.
        if (!user.isRegistrationComplete() && request.hasDrivingLicenseB() != null) {
            user.setRegistrationComplete(true);
        }
        if (request.locale() != null && !request.locale().isBlank()) {
            user.setLocale(MailTexts.normalize(request.locale()));
        }
        user = userRepository.save(user);
        return toUserDto(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (user.isGoogleAccount()) {
            throw ApiException.badRequest("Konto Google — hasło zmieniasz w Google, nie tutaj");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Nieprawidłowe obecne hasło");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revokeAllAndBump(user);
    }

    /**
     * Start resetu hasła: jednorazowy link (TTL {@link #PASSWORD_RESET_TOKEN_TTL_MINUTES} min).
     * Hasło NIE jest zmieniane, dopóki użytkownik nie wyśle nowego na {@link #resetPassword}.
     * Soft-fail SMTP: przy błędzie dostawy hasło bez zmian (token wygasa / kolejna prośba nadpisuje).
     * Nie ujawnia istnienia konta – zawsze ten sam komunikat z kontrolera i ta sama wysyłka SMTP.
     * Brak konta nie skraca requestu: token jest losowany, HTML składany, a mail idzie na skrzynkę
     * nadawcy ({@link MailService#sendDecoy}) zamiast na sondowany adres. Tokenu z tej ścieżki nie zapisujemy.
     */
    @Transactional
    public void forgotPassword(String email, String clientIp) {
        String emailNorm = email == null ? "" : email.trim().toLowerCase();
        attemptRateLimiter.check("forgot:" + emailNorm, RESEND_MAX_ATTEMPTS, AUTH_CODE_WINDOW,
                "Zbyt wiele próśb o reset hasła dla tego adresu. Spróbuj ponownie za kilka minut.");
        attemptRateLimiter.check("forgot:ip:" + (clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim()),
                FORGOT_MAX_PER_IP, AUTH_CODE_WINDOW,
                "Zbyt wiele próśb o reset hasła z tej sieci. Spróbuj ponownie za kilka minut.");

        User user = userRepository.findByEmailIgnoreCase(emailNorm).orElse(null);
        String token = generateVerificationToken();
        // Konta Google nie mają lokalnego hasła — bez tokenu, ten sam komunikat (bez oracle).
        if (user != null && !user.isGoogleAccount()) {
            user.setPasswordResetToken(token);
            user.setPasswordResetExpires(Instant.now().plus(PASSWORD_RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            userRepository.save(user);
        }

        User mailUser = (user != null && !user.isGoogleAccount()) ? user : null;
        boolean sent = deliverPasswordResetMail(mailUser, token);
        if (mailUser != null && !sent) {
            log.warn("Password reset mail failed for user {}; password unchanged", mailUser.getId());
        }
    }

    /**
     * Kończy reset: waliduje jednorazowy token, ustawia nowe hasło, kasuje token.
     */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String token = rawToken == null ? "" : rawToken.trim();
        attemptRateLimiter.check("reset-token:" + token, VERIFY_MAX_ATTEMPTS, AUTH_CODE_WINDOW);

        if (token.isBlank()) {
            throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
        }

        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> ApiException.badRequest("Nieprawidłowy lub wygasły link"));

        if (user.getPasswordResetExpires() == null
                || Instant.now().isAfter(user.getPasswordResetExpires())
                || user.getPasswordResetToken() == null
                || !user.getPasswordResetToken().equals(token)) {
            throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
        }
        if (user.isGoogleAccount()) {
            throw ApiException.badRequest("Konto Google — hasło zmieniasz w Google, nie tutaj");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpires(null);
        userRepository.save(user);
        refreshTokenService.revokeAllAndBump(user);
    }

    /**
     * Start zmiany e-maila (pentest #8): wymaga aktualnego hasła.
     * Link potwierdzający idzie na <em>nowy</em> adres; stary dostaje alert (bez linku potwierdzającego).
     */
    @Transactional
    public MessageResponse requestEmailChange(String userId, String rawNewEmail, String currentPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (user.isGoogleAccount()) {
            throw ApiException.badRequest("Konto Google — e-mail zmieniasz w Google, nie tutaj");
        }
        String newEmail = rawNewEmail.trim().toLowerCase();
        attemptRateLimiter.check("email-change:" + userId, RESEND_MAX_ATTEMPTS, AUTH_CODE_WINDOW);

        if (currentPassword == null || currentPassword.isBlank()
                || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.unauthorized("Nieprawidłowe obecne hasło");
        }
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw ApiException.badRequest("Podaj adres inny niż obecny");
        }

        String oldEmail = user.getEmail();
        // Zajęty adres: ten sam HTTP 200 + komunikat co przy sukcesie — bez linku na cudzą skrzynkę.
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            notifyOldEmailAboutPendingChange(user, oldEmail, newEmail);
            return new MessageResponse(EMAIL_CHANGE_REQUEST_MESSAGE);
        }

        user.setPendingEmail(newEmail);
        sendVerificationLinkTo(user, newEmail);
        notifyOldEmailAboutPendingChange(user, oldEmail, newEmail);
        return new MessageResponse(EMAIL_CHANGE_REQUEST_MESSAGE);
    }

    /**
     * Potwierdza zmianę e-maila tokenem (zalogowany użytkownik); unieważnia stare sesje.
     */
    @Transactional
    public AuthResponse confirmEmailChange(String userId, String token) {
        attemptRateLimiter.check("email-confirm:" + userId, VERIFY_MAX_ATTEMPTS, AUTH_CODE_WINDOW);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (user.getPendingEmail() == null || user.getPendingEmail().isBlank()) {
            throw ApiException.badRequest("Brak oczekującej zmiany e-maila");
        }
        applyVerificationToken(user, token == null ? "" : token.trim());
        refreshTokenService.revokeAllAndBump(user);
        return issueSession(user);
    }

    /** Access JWT + nowy refresh (do cookie / body). */
    private AuthResponse issueSession(User user) {
        String access = jwtService.generateToken(user);
        String refresh = refreshTokenService.issue(user);
        return new AuthResponse(access, refresh, toUserDto(user));
    }

    public Duration accessTokenTtl() {
        return jwtService.getAccessTtl();
    }

    public Duration refreshTokenTtl() {
        return refreshTokenService.getRefreshTtl();
    }

    /** Tworzy użytkownika z {@code emailVerified=false} i zahashowanym hasłem. */
    private User createUnverifiedUser(String username, String rawEmail, String rawPassword, Role role) {
        String email = rawEmail.toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Konto z tym emailem już istnieje");
        }

        User user = new User();
        user.setUsername(claimUsername(username, null));
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAvatar(null);
        user.setEmailVerified(false);
        return userRepository.save(user);
    }

    /**
     * Waliduje i rezerwuje nazwę wyświetlaną (pentest #6): trim, brak zarezerwowanych słów,
     * unikalność case-insensitive → 409 przy zajętej, 400 przy zarezerwowanej.
     *
     * @param excludeUserId {@code null} przy rejestracji; id własnego konta przy zmianie profilu
     */
    private String claimUsername(String rawUsername, String excludeUserId) {
        String username = rawUsername == null ? "" : rawUsername.trim();
        if (username.length() < 2 || username.length() > 40) {
            throw ApiException.badRequest("Nazwa użytkownika: 2–40 znaków");
        }
        if (ReservedUsernames.isReserved(username)) {
            throw ApiException.badRequest("Ta nazwa użytkownika jest zarezerwowana");
        }
        boolean taken = excludeUserId == null
                ? userRepository.existsByUsernameIgnoreCase(username)
                : userRepository.existsByUsernameIgnoreCaseAndIdNot(username, excludeUserId);
        if (taken) {
            throw ApiException.conflict("Ta nazwa użytkownika jest już zajęta");
        }
        return username;
    }

    /**
     * Składa ten sam list resetu dla istniejącego konta i dla adresu spoza bazy.
     * Adres spoza bazy dostaje wysyłkę na skrzynkę nadawcy — sondowany adres nie dostaje maila z naszej domeny.
     */
    private boolean deliverPasswordResetMail(User userOrNull, String token) {
        String locale = MailTexts.of(userOrNull);
        String username = userOrNull == null || userOrNull.getUsername() == null
                ? (MailTexts.isEn(locale) ? "driver" : "kierowca")
                : userOrNull.getUsername();
        String safeName = escapeHtml(username);
        String link = publicBaseUrl + "/reset-password/" + token;
        String safeLink = escapeHtml(link);
        String subject = MailTexts.passwordResetSubject(locale);
        String html = MailTexts.passwordResetBody(locale, safeName, safeLink, PASSWORD_RESET_TOKEN_TTL_MINUTES);
        if (userOrNull == null) {
            return mailService.sendDecoy(subject, html, locale);
        }
        return mailService.send(userOrNull.getEmail(), subject, html, locale);
    }

    /** Alert na dotychczasowy adres — bez linku potwierdzającego (ten idzie tylko na nowy). */
    private void notifyOldEmailAboutPendingChange(User user, String oldEmail, String newEmail) {
        String locale = MailTexts.of(user);
        String safeName = escapeHtml(user.getUsername() == null ? "" : user.getUsername());
        String safeNew = escapeHtml(newEmail);
        boolean sent = mailService.send(oldEmail,
                MailTexts.emailChangeAlertSubject(locale),
                MailTexts.emailChangeAlertBody(locale, safeName, safeNew),
                locale);
        if (!sent) {
            log.warn("Email-change alert to old address failed for {}", oldEmail);
        }
    }

    private void sendVerificationLink(User user) {
        sendVerificationLinkTo(user, user.getEmail());
    }

    /** Generuje token, zapisuje TTL i wysyła mail z linkiem (rejestracja lub zmiana e-maila). */
    private void sendVerificationLinkTo(User user, String targetEmail) {
        String token = generateVerificationToken();
        user.setEmailVerificationCode(token);
        user.setEmailVerificationExpires(Instant.now().plus(VERIFICATION_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
        userRepository.save(user);

        String locale = MailTexts.of(user);
        String safeName = escapeHtml(user.getUsername() == null ? "" : user.getUsername());
        // Token w ścieżce (nie ?token=) – mniej blokad WAF/skanerów maili na query string → 403.
        String link = publicBaseUrl + "/verify-email/" + token;
        String safeLink = escapeHtml(link);
        boolean emailChange = user.getPendingEmail() != null && !user.getPendingEmail().isBlank();
        mailService.send(targetEmail,
                MailTexts.activateSubject(locale, emailChange),
                MailTexts.activateBody(locale, safeName, safeLink, emailChange, VERIFICATION_TOKEN_TTL_MINUTES),
                locale);
    }

    private User resolveUserForToken(String email, String token) {
        if (token.isBlank()) {
            throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
        }
        if (email != null && !email.isBlank()) {
            User user = userRepository.findByEmailIgnoreCase(email.trim())
                    .orElseThrow(() -> ApiException.badRequest("Nieprawidłowy lub wygasły link"));
            if (user.getEmailVerificationCode() == null || !user.getEmailVerificationCode().equals(token)) {
                throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
            }
            return user;
        }
        return userRepository.findByEmailVerificationCode(token)
                .orElseThrow(() -> ApiException.badRequest("Nieprawidłowy lub wygasły link"));
    }

    private void applyVerificationToken(User user, String token) {
        if (user.getEmailVerificationCode() == null || user.getEmailVerificationExpires() == null
                || !user.getEmailVerificationCode().equals(token)
                || Instant.now().isAfter(user.getEmailVerificationExpires())) {
            throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
        }

        String pending = user.getPendingEmail();
        if (pending != null && !pending.isBlank()) {
            if (userRepository.existsByEmailIgnoreCase(pending)
                    && !pending.equalsIgnoreCase(user.getEmail())) {
                // Race: adres zajęty między prośbą a confirm — bez 409 oracle.
                user.setEmailVerificationCode(null);
                user.setEmailVerificationExpires(null);
                user.setPendingEmail(null);
                userRepository.save(user);
                throw ApiException.badRequest("Nieprawidłowy lub wygasły link");
            }
            user.setEmail(pending);
            user.setPendingEmail(null);
            user.setEmailVerified(true);
        } else if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
        }

        // Jednorazowość: token znika po użyciu (nawet gdy w access logu nginx został URI).
        user.setEmailVerificationCode(null);
        user.setEmailVerificationExpires(null);
        userRepository.save(user);
    }

    private String generateVerificationToken() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "http://localhost:8081";
        }
        String trimmed = url.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String escapeHtml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    /**
     * USER / ORGANIZER mogą zamknąć własne konto po wpisaniu {@link #CLOSE_ACCOUNT_PHRASE}.
     * ADMIN — nie (zarządzanie kontami adminów tylko przez innego admina).
     * Wydarzenia organizatora przechodzą na dowolnego ADMINA.
     */
    @Transactional
    @CacheEvict(cacheNames = "events", allEntries = true)
    public void closeOwnAccount(String userId, String confirmation) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Nie znaleziono użytkownika"));
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("Administrator nie może zamknąć konta samodzielnie");
        }
        String phrase = confirmation == null ? "" : confirmation.trim().toLowerCase(Locale.ROOT);
        if (!CLOSE_ACCOUNT_PHRASE.equals(phrase)) {
            throw ApiException.badRequest("Aby zamknąć konto, wpisz dokładnie: zamknij konto");
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        User handoff = admins.stream().filter(a -> !a.getId().equals(userId)).findFirst().orElse(null);
        List<Event> organized = eventRepository.findByOrganizer_IdOrderByDateDesc(userId);
        if (!organized.isEmpty()) {
            if (handoff == null) {
                throw ApiException.badRequest(
                        "Nie można zamknąć konta: masz wydarzenia, a w systemie nie ma administratora do przejęcia");
            }
            for (Event event : organized) {
                event.setOrganizer(handoff);
            }
            eventRepository.saveAll(organized);
            eventRepository.flush();
        }

        registrationRepository.deleteByCar_User_Id(userId);
        registrationRepository.deleteByUser_Id(userId);
        notificationRepository.deleteByUser_Id(userId);
        organizerApplicationRepository.deleteByUser_Id(userId);
        bugReportRepository.detachUser(userId);
        carRepository.deleteByUser_Id(userId);
        refreshTokenRepository.deleteByUser_Id(userId);
        userRepository.deleteById(userId);
    }

    private UserDto toUserDto(User user) {
        String memberSince = String.valueOf(user.getCreatedAt().atZone(ZoneOffset.UTC).getYear());
        return new UserDto(user.getId(), user.getEmail(), user.getUsername(),
                user.getRole().name(), user.getAvatar(), memberSince,
                user.getFirstName(), user.getLastName(), user.getPhone(),
                user.getAddress(), user.getInstagramUrl(),
                user.isHasDrivingLicenseB(), user.getPzmLicense(),
                MailTexts.normalize(user.getLocale()),
                user.isRegistrationComplete(),
                user.isGoogleAccount());
    }

    private void applyProfileFields(User user, String firstName, String lastName, String phone,
                                     Boolean hasDrivingLicenseB, String pzmLicense,
                                     String address, String instagramUrl) {
        if (firstName != null) user.setFirstName(firstName.isBlank() ? null : firstName.trim());
        if (lastName != null) user.setLastName(lastName.isBlank() ? null : lastName.trim());
        if (phone != null) {
            if (phone.isBlank()) {
                user.setPhone(null);
            } else {
                String normalized = normalizePhone(phone);
                ensurePhoneUnique(normalized, user.getId());
                user.setPhone(normalized);
            }
        }
        if (address != null) user.setAddress(address.isBlank() ? null : address.trim());
        if (instagramUrl != null) user.setInstagramUrl(instagramUrl.isBlank() ? null : instagramUrl.trim());
        if (hasDrivingLicenseB != null) user.setHasDrivingLicenseB(hasDrivingLicenseB);
        if (pzmLicense != null) user.setPzmLicense(pzmLicense.isBlank() ? null : pzmLicense.trim());
    }

    private void ensurePhoneUnique(String phone, String userId) {
        boolean taken = userId == null
                ? userRepository.existsByPhone(phone)
                : userRepository.existsByPhoneAndIdNot(phone, userId);
        if (taken) {
            throw ApiException.conflict("Numer telefonu jest już zajęty");
        }
    }

    private static String normalizePhone(String phone) {
        return phone.trim().replaceAll("\\s+", " ");
    }
}
