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

@Slf4j
@Component
@RequiredArgsConstructor
public class ResendClient {

    private static final String RESEND_URL = "https://api.resend.com/emails";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${embos.mail.resend-api-key}")
    private String apiKey;

    @Value("${embos.mail.from}")
    private String from;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void send(String to, String subject, String html) {
        if (!isEnabled()) {
            log.warn("Email sending disabled: RESEND_API_KEY not configured. Skipping email to {}", to);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Skipping email with blank recipient (subject: {})", subject);
            return;
        }
        String body = """
                {
                  "from": %s,
                  "to": [%s],
                  "subject": %s,
                  "html": %s
                }
                """.formatted(json(from), json(to), json(subject), json(html));
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent to {} (subject: {})", to, subject);
            } else {
                log.error("Resend API returned {} for email to {}: {}",
                        response.statusCode(), to, response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {} (subject: {})", to, subject, e);
        }
    }

    private static String json(String value) {
        if (value == null) {
            return "null";
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
}
