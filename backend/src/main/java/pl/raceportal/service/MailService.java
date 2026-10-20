package pl.raceportal.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Wysyłka wiadomości e-mail (HTML) przez Spring Mail.
 * <p>
 * Rola w architekturze: powiadomienia transakcyjne — weryfikacja konta, reset hasła,
 * zmiany statusu zgłoszenia. Wywołania są „soft-fail”: błąd SMTP nie psuje requestu HTTP.
 * Technologie: Spring Boot Mail ({@link JavaMailSender}), SMTP (MySQL nie dotyczy).
 * </p>
 * Pomysł (alt): kolejka (RabbitMQ/SQS) + worker mailowy; SendGrid/Mailgun zamiast SMTP;
 * outbox pattern w DB.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public MailService(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    /**
     * Wysyła mail HTML. Błędy dostawy są logowane, ale nie propagowane —
     * nie mogą przerwać rejestracji / zmiany statusu zgłoszenia.
     *
     * @param to      adres odbiorcy
     * @param subject temat
     * @param html    treść HTML
     */
    public void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("[mail] Failed to send email to {}: {}", to, ex.getMessage());
        }
    }
}
