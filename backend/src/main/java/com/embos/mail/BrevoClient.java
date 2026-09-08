package com.embos.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class BrevoClient {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    private static final Pattern SENDER_PATTERN = Pattern.compile("^(.*?)\\s*<([^>]+)>$");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${embos.mail.brevo-api-key}")
    private String apiKey;

    @Value("${embos.mail.from}")
    private String from;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void send(String to, String subject, String html) {
        if (!isEnabled()) {
            log.warn("Email sending disabled: BREVO_API_KEY not configured. Skipping email to {}", to);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Skipping email with blank recipient (subject: {})", subject);
            return;
        }
        String senderEmail;
        String senderName;
        Matcher m = SENDER_PATTERN.matcher(from == null ? "" : from.trim());
        if (m.matches()) {
            senderName = m.group(1).trim().isEmpty() ? "EMBOS" : m.group(1).trim();
            senderEmail = m.group(2).trim();
        } else {
            senderEmail = from == null ? "" : from.trim();
            senderName = "EMBOS";
        }
        String body = """
                {
                  "sender": {"name": %s, "email": %s},
                  "to": [{"email": %s}],
                  "subject": %s,
                  "htmlContent": %s
                }
                """.formatted(json(senderName), json(senderEmail), json(to), json(subject),
                json(wrapHtml(html)));
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("api-key", apiKey)
                    .header("accept", "application/json")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent to {} (subject: {})", to, subject);
            } else {
                log.error("Brevo API returned {} for email to {}: {}",
                        response.statusCode(), to, response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {} (subject: {})", to, subject, e);
        }
    }

    static String wrapHtml(String html) {
        if (html == null) {
            return "";
        }
        if (html.trim().toLowerCase().startsWith("<html")) {
            return html;
        }
        return "<html><body style=\"margin:0\">" + html + "</body></html>";
    }

    private static String json(String value) {
        if (value == null) {
            return "null";
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
}