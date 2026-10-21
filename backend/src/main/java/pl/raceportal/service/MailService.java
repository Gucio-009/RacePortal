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
 * Każda wiadomość dostaje wspólny układ RacePortal (czerń #121212, karta #1a1a1a, akcent #FFD700).
 * Wywołania są „soft-fail”: błąd SMTP nie psuje requestu HTTP.
 * </p>
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private static final String PARAGRAPH_STYLE =
            "margin:0 0 14px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;";
    private static final String STRONG_STYLE = "color:#FFD700;";

    private final JavaMailSender mailSender;
    private final String from;

    public MailService(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    /**
     * Duży złoty kod (weryfikacja konta). Sam kod, bez otaczającego akapitu.
     */
    public String codeBox(String code) {
        String safe = code == null ? "" : code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
                  <tr>
                    <td align="center" style="background:#121212;border:1px solid #FFD700;border-radius:8px;padding:16px 28px;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;letter-spacing:0.28em;color:#FFD700;">%s</td>
                  </tr>
                </table>
                """.formatted(safe);
    }

    /**
     * Wysyła mail HTML w układzie portalu. Błędy dostawy są logowane, ale nie propagowane.
     *
     * @param to       adres odbiorcy
     * @param subject  temat
     * @param bodyHtml treść (akapity {@code <p>}, {@code <strong>}); owijana w szablon
     */
    public void send(String to, String subject, String bodyHtml) {
        try {
            String html = layout(subject, bodyHtml);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(toPlain(bodyHtml), html);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("[mail] Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    private String layout(String subject, String bodyHtml) {
        String body = bodyHtml == null ? "" : bodyHtml
                .replace("<p>", "<p style=\"" + PARAGRAPH_STYLE + "\">")
                .replace("<strong>", "<strong style=\"" + STRONG_STYLE + "\">");
        String safeSubject = subject == null ? "RacePortal" : subject
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
        return """
                <!DOCTYPE html>
                <html lang="pl">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#121212;">
                  <div style="display:none;max-height:0;overflow:hidden;color:#121212;">%s</div>
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#121212;">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;">
                          <tr>
                            <td style="padding:28px 32px 16px;border-bottom:1px solid #2a2a2a;">
                              <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:0.14em;color:#FFD700;">RACEPORTAL</div>
                              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;color:#9ca3af;margin-top:6px;">WYŚCIGI · TOR · ZGŁOSZENIA</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px 32px 8px;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 32px 28px;">
                              <a href="https://raceportal.pl" style="display:inline-block;background:#FFD700;color:#121212;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.06em;text-decoration:none;padding:12px 18px;border-radius:8px;">OTWÓRZ RACEPORTAL</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 32px 24px;border-top:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#9ca3af;">
                              Wiadomość wysłana automatycznie z raceportal.pl. Nie odpowiadaj na ten adres.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(safeSubject, safeSubject, body);
    }

    private String toPlain(String html) {
        String text = html == null ? "" : html
                .replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
        return "RACEPORTAL\n\n" + text + "\n\nhttps://raceportal.pl";
    }
}
