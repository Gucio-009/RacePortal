package pl.raceportal.i18n;

import pl.raceportal.domain.User;

/**
 * Dwujęzyczne (pl/en) tematy i treści maili systemowych.
 * Locale odbiorcy: {@link User#getLocale()} (domyślnie {@code pl}).
 */
public final class MailTexts {

    public static final String PL = "pl";
    public static final String EN = "en";

    private MailTexts() {
    }

    public static String normalize(String locale) {
        if (locale != null && locale.trim().equalsIgnoreCase(EN)) {
            return EN;
        }
        return PL;
    }

    public static String of(User user) {
        return user == null ? PL : normalize(user.getLocale());
    }

    public static boolean isEn(String locale) {
        return EN.equals(normalize(locale));
    }

    public static String tagline(String locale) {
        return isEn(locale) ? "RACING · TRACK · ENTRIES" : "WYŚCIGI · TOR · ZGŁOSZENIA";
    }

    public static String openCta(String locale) {
        return isEn(locale) ? "OPEN RACEPORTAL" : "OTWÓRZ RACEPORTAL";
    }

    public static String footer(String locale) {
        return isEn(locale)
                ? "Automated message from raceportal.pl. Please do not reply to this address."
                : "Wiadomość wysłana automatycznie z raceportal.pl. Nie odpowiadaj na ten adres.";
    }

    public static String passwordResetSubject(String locale) {
        return isEn(locale) ? "Password reset RACEPORTAL" : "Reset hasła RACEPORTAL";
    }

    public static String passwordResetBody(String locale, String safeName, String safeLink, int ttlMinutes) {
        if (isEn(locale)) {
            return "<p>Hi " + safeName + ",</p>"
                    + "<p>We received a password reset request. Click the button below to set a new password."
                    + " The link is one-time and valid for " + ttlMinutes + " minutes.</p>"
                    + ctaButton(safeLink, "SET NEW PASSWORD")
                    + "<p style=\"font-size:13px;color:#9ca3af;\">If you did not request a reset, ignore this message – "
                    + "your password stays unchanged.<br>If the button does not work, paste this URL:<br>"
                    + linkSpan(safeLink) + "</p>";
        }
        return "<p>Cześć " + safeName + ",</p>"
                + "<p>Otrzymaliśmy prośbę o reset hasła. Kliknij poniższy przycisk, aby ustawić nowe hasło."
                + " Link jest jednorazowy i ważny przez " + ttlMinutes + " minut.</p>"
                + ctaButton(safeLink, "USTAW NOWE HASŁO")
                + "<p style=\"font-size:13px;color:#9ca3af;\">Jeśli nie prosiłeś o reset, zignoruj tę wiadomość – "
                + "hasło pozostaje bez zmian.<br>Jeśli przycisk nie działa, wklej adres:<br>"
                + linkSpan(safeLink) + "</p>";
    }

    public static String activateSubject(String locale, boolean emailChange) {
        if (isEn(locale)) {
            return emailChange ? "Confirm your new email RACEPORTAL" : "Activate your RACEPORTAL account";
        }
        return emailChange ? "Potwierdź nowy e-mail RACEPORTAL" : "Aktywuj konto RACEPORTAL";
    }

    public static String activateBody(String locale, String safeName, String safeLink, boolean emailChange, int ttlMinutes) {
        if (isEn(locale)) {
            String intro = emailChange
                    ? "Click the button below to confirm your new email address."
                    : "Click the button below to activate your account.";
            String cta = emailChange ? "CONFIRM EMAIL" : "ACTIVATE ACCOUNT";
            return "<p>Hi " + safeName + ",</p><p>" + intro + "</p>"
                    + ctaButton(safeLink, cta)
                    + "<p style=\"font-size:13px;color:#9ca3af;\">This link is valid for " + ttlMinutes
                    + " minutes. If the button does not work, paste this URL:<br>"
                    + linkSpan(safeLink) + "</p>";
        }
        String intro = emailChange
                ? "Kliknij poniższy przycisk, aby potwierdzić nowy adres e-mail."
                : "Kliknij poniższy przycisk, aby aktywować konto.";
        String cta = emailChange ? "POTWIERDŹ E-MAIL" : "AKTYWUJ KONTO";
        return "<p>Cześć " + safeName + ",</p><p>" + intro + "</p>"
                + ctaButton(safeLink, cta)
                + "<p style=\"font-size:13px;color:#9ca3af;\">Link jest ważny przez " + ttlMinutes
                + " minut. Jeśli przycisk nie działa, wklej adres:<br>"
                + linkSpan(safeLink) + "</p>";
    }

    public static String emailChangeAlertSubject(String locale) {
        return isEn(locale) ? "Email change request RACEPORTAL" : "Prośba o zmianę e-maila RACEPORTAL";
    }

    public static String emailChangeAlertBody(String locale, String safeName, String safeNew) {
        if (isEn(locale)) {
            return "<p>Hi " + safeName + ",</p>"
                    + "<p>We received a request to change this account's email to <strong>" + safeNew + "</strong>.</p>"
                    + "<p>If the address is available, the confirmation link goes only to the new inbox. "
                    + "If this was not you — change your password in account settings. "
                    + "Until the link is clicked, you still sign in with this address.</p>";
        }
        return "<p>Cześć " + safeName + ",</p>"
                + "<p>Otrzymaliśmy prośbę o zmianę adresu e-mail tego konta na <strong>" + safeNew + "</strong>.</p>"
                + "<p>Jeśli adres jest wolny, link potwierdzający trafia wyłącznie na nową skrzynkę. "
                + "Jeśli to nie Ty — zmień hasło w ustawieniach konta. "
                + "Dopóki link nie zostanie kliknięty, logujesz się nadal tym adresem.</p>";
    }

    public static String registrationReceivedSubject(String locale, String eventName) {
        return isEn(locale) ? "Entry: " + eventName : "Zgłoszenie: " + eventName;
    }

    public static String registrationReceivedBody(String locale, String eventName) {
        if (isEn(locale)) {
            return "<p>Your entry for <strong>" + eventName
                    + "</strong> was received and is waiting for the organizer's decision.</p>";
        }
        return "<p>Twoje zgłoszenie na <strong>" + eventName
                + "</strong> zostało przyjęte i oczekuje na decyzję organizatora.</p>";
    }

    public static String registrationCancelSubject(String locale, String eventName) {
        return isEn(locale) ? "Entry cancelled: " + eventName : "Rezygnacja ze zgłoszenia: " + eventName;
    }

    public static String registrationCancelBody(String locale, String eventName, boolean refundByOrganizer) {
        String refund = "";
        if (refundByOrganizer) {
            refund = isEn(locale)
                    ? "<p>A refund for this entry will be handled by the organizer.</p>"
                    : "<p>Zwrot środków za zgłoszenie zostanie zrealizowany przez organizatora.</p>";
        }
        if (isEn(locale)) {
            return "<p>We confirm cancellation of your entry for <strong>" + eventName + "</strong>.</p>" + refund;
        }
        return "<p>Potwierdzamy anulowanie Twojego zgłoszenia na <strong>" + eventName + "</strong>.</p>" + refund;
    }

    public static String registrationStatusSubject(String locale, String eventName) {
        return isEn(locale) ? "Entry status: " + eventName : "Status zgłoszenia: " + eventName;
    }

    public static String registrationStatusBody(String locale, String eventName, String status,
                                                 Integer paymentHours, String bankAccount) {
        String bankNote = "";
        if (paymentHours != null && bankAccount != null) {
            bankNote = isEn(locale)
                    ? "<p>To confirm participation, pay the entry fee within " + paymentHours
                    + " hours to: <strong>" + bankAccount
                    + "</strong> and attach the transfer proof in your profile.</p>"
                    : "<p>Aby potwierdzić udział, wpłać wpisowe w ciągu " + paymentHours
                    + " godzin na numer konta: <strong>" + bankAccount
                    + "</strong> i dołącz potwierdzenie przelewu w swoim profilu.</p>";
        }
        if (isEn(locale)) {
            return "<p>Status of your entry for <strong>" + eventName + "</strong>: <strong>"
                    + status + "</strong>.</p>" + bankNote;
        }
        return "<p>Status Twojego zgłoszenia na <strong>" + eventName + "</strong>: <strong>"
                + status + "</strong>.</p>" + bankNote;
    }

    public static String eventCancelledSubject(String locale, String eventName) {
        return isEn(locale) ? "Event cancelled: " + eventName : "Wydarzenie anulowane: " + eventName;
    }

    public static String eventCancelledBody(String locale, String eventName, boolean paid) {
        String refund = paid
                ? (isEn(locale)
                ? "<p>If you already paid, the organizer will process the refund.</p>"
                : "<p>Jeśli dokonałeś/aś już płatności, zwrot środków zostanie zrealizowany przez organizatora.</p>")
                : "";
        if (isEn(locale)) {
            return "<p>Event <strong>" + eventName
                    + "</strong> was cancelled by the organizer, and your entry is now <strong>CANCELED</strong>.</p>"
                    + refund;
        }
        return "<p>Wydarzenie <strong>" + eventName
                + "</strong> zostało anulowane przez organizatora, "
                + "a Twoje zgłoszenie otrzymało status <strong>CANCELED</strong>.</p>" + refund;
    }

    public static String eventUpdatedSubject(String locale, String eventName) {
        return isEn(locale) ? "Event updated: " + eventName : "Zmiany w wydarzeniu: " + eventName;
    }

    public static String eventUpdatedBody(String locale, String eventName) {
        if (isEn(locale)) {
            return "<p>The organizer updated details for <strong>" + eventName
                    + "</strong>, which you are entered for.</p>";
        }
        return "<p>Organizator zaktualizował informacje o wydarzeniu <strong>" + eventName
                + "</strong>, na które jesteś zgłoszony/a.</p>";
    }

    public static String roleChangedSubject(String locale) {
        return isEn(locale) ? "Role change in RACEPORTAL" : "Zmiana roli w RACEPORTAL";
    }

    public static String roleChangedBody(String locale, String role) {
        if (isEn(locale)) {
            return "<p>Your role in the system is now: <strong>" + role + "</strong>.</p>";
        }
        return "<p>Twoja rola w systemie to teraz: <strong>" + role + "</strong>.</p>";
    }

    public static String eventApprovedSubject(String locale, String eventName) {
        return isEn(locale)
                ? "RACEPORTAL: event approved – " + eventName
                : "RACEPORTAL: wydarzenie zaakceptowane – " + eventName;
    }

    public static String eventApprovedBody(String locale, String safeName) {
        if (isEn(locale)) {
            return "<p>Your event <strong>" + safeName + "</strong> was <strong>approved</strong>.</p>"
                    + "<p>It is now visible in the RacePortal calendar.</p>";
        }
        return "<p>Twoje wydarzenie <strong>" + safeName + "</strong> zostało <strong>zaakceptowane</strong>.</p>"
                + "<p>Jest już widoczne w kalendarzu RacePortal.</p>";
    }

    public static String eventRejectedSubject(String locale, String eventName) {
        return isEn(locale)
                ? "RACEPORTAL: event rejected – " + eventName
                : "RACEPORTAL: wydarzenie odrzucone – " + eventName;
    }

    public static String eventRejectedBody(String locale, String safeName, String safeReason) {
        if (isEn(locale)) {
            return "<p>Your event <strong>" + safeName + "</strong> was <strong>rejected</strong>.</p>"
                    + "<p><strong>Reason:</strong> " + safeReason + "</p>"
                    + "<p>You can fix the event in the organizer panel and resubmit it for moderation.</p>";
        }
        return "<p>Twoje wydarzenie <strong>" + safeName + "</strong> zostało <strong>odrzucone</strong>.</p>"
                + "<p><strong>Powód:</strong> " + safeReason + "</p>"
                + "<p>Możesz poprawić wydarzenie w panelu organizatora i wysłać je ponownie do moderacji.</p>";
    }

    public static String eventStatusSubject(String locale, String eventName) {
        return isEn(locale)
                ? "RACEPORTAL: event status – " + eventName
                : "RACEPORTAL: status wydarzenia – " + eventName;
    }

    public static String eventStatusBody(String locale, String safeName, String status) {
        if (isEn(locale)) {
            return "<p>Event <strong>" + safeName + "</strong> is now: <strong>" + status + "</strong>.</p>";
        }
        return "<p>Wydarzenie <strong>" + safeName + "</strong> ma teraz status: <strong>" + status + "</strong>.</p>";
    }

    public static String organizerAppSubject(String locale) {
        return isEn(locale) ? "Organizer role application" : "Wniosek o rolę organizatora";
    }

    public static String organizerAppBody(String locale, String status) {
        if (isEn(locale)) {
            return "<p>Your organizer application status: <strong>" + status + "</strong>.</p>";
        }
        return "<p>Twój wniosek o konto organizatora: <strong>" + status + "</strong>.</p>";
    }

    public static String pendingReviewSubject(String locale, String eventName) {
        return isEn(locale)
                ? "RACEPORTAL: event awaiting approval – " + eventName
                : "RACEPORTAL: wydarzenie do akceptacji – " + eventName;
    }

    public static String pendingReviewBody(String locale, String safeName, String safeOrg) {
        if (isEn(locale)) {
            return "<p>A new event is waiting for moderation.</p>"
                    + "<p><strong>" + safeName + "</strong> (organizer: " + safeOrg + ")</p>"
                    + "<p>Open the admin panel to approve or reject it.</p>";
        }
        return "<p>Nowe wydarzenie oczekuje na moderację.</p>"
                + "<p><strong>" + safeName + "</strong> (organizator: " + safeOrg + ")</p>"
                + "<p>Otwórz panel admina i zaakceptuj lub odrzuć wniosek.</p>";
    }

    private static String ctaButton(String safeLink, String label) {
        return "<p style=\"margin:18px 0;\">"
                + "<a href=\"" + safeLink + "\" style=\"display:inline-block;background:#FFD700;color:#121212;"
                + "font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.06em;"
                + "text-decoration:none;padding:14px 22px;border-radius:8px;\">" + label + "</a></p>";
    }

    private static String linkSpan(String safeLink) {
        return "<span style=\"word-break:break-all;color:#FFD700;\">" + safeLink + "</span>";
    }
}
