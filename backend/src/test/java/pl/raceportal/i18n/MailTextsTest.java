package pl.raceportal.i18n;

import org.junit.jupiter.api.Test;
import pl.raceportal.domain.User;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MailTextsTest {

    @Test
    void defaultsToPolish() {
        assertEquals("pl", MailTexts.normalize(null));
        assertEquals("pl", MailTexts.normalize(""));
        assertEquals("pl", MailTexts.normalize("de"));
        assertEquals("en", MailTexts.normalize("EN"));
    }

    @Test
    void passwordResetSubjectFollowsLocale() {
        assertEquals("Reset hasła RACEPORTAL", MailTexts.passwordResetSubject("pl"));
        assertEquals("Password reset RACEPORTAL", MailTexts.passwordResetSubject("en"));
    }

    @Test
    void layoutCopyFollowsLocale() {
        assertTrue(MailTexts.tagline("en").contains("RACING"));
        assertFalse(MailTexts.tagline("pl").contains("RACING"));
        assertEquals("OPEN RACEPORTAL", MailTexts.openCta("en"));
        assertEquals("OTWÓRZ RACEPORTAL", MailTexts.openCta("pl"));
    }

    @Test
    void ofUserReadsLocale() {
        User user = new User();
        user.setLocale("en");
        assertEquals("en", MailTexts.of(user));
        assertEquals("pl", MailTexts.of(null));
    }
}
