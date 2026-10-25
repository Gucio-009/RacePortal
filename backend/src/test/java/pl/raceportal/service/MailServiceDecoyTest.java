package pl.raceportal.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Decoy resetu hasła ma przejść ten sam SMTP, ale na skrzynkę nadawcy — nie na sondowany adres.
 */
class MailServiceDecoyTest {

    @Test
    void sendDecoyAddressesTheSenderMailbox() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        MailService mail = new MailService(sender, "RACEPORTAL <noreply@raceportal.pl>");

        assertTrue(mail.sendDecoy("Reset hasła RACEPORTAL", "<p>Cześć</p>"));

        ArgumentCaptor<MimeMessage> sent = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(sent.capture());
        assertEquals("noreply@raceportal.pl", sent.getValue().getAllRecipients()[0].toString());
    }
}
