package com.embos.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class OpenRouterClient {

    private static final String CHAT_PATH = "/chat/completions";
    private static final int MAX_ATTEMPTS = 2;
    private static final int MAX_TOKENS = 2000;
    private static final List<Integer> RETRYABLE_STATUS = List.of(429, 500, 502, 503, 504);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${embos.ai.openrouter-api-key}")
    private String apiKey;

    @Value("${embos.ai.model}")
    private String model;

    @Value("${embos.ai.base-url}")
    private String baseUrl;

    public OpenRouterClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public Optional<String> chatJson(String systemPrompt, String userPrompt) {
        if (!isEnabled()) {
            log.warn("AI recommendations disabled: OPENROUTER_API_KEY not configured");
            return Optional.empty();
        }
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("temperature", 0.3);
        body.put("max_tokens", MAX_TOKENS);
        ArrayNode messages = body.putArray("messages");
        messages.add(objectMapper.createObjectNode().put("role", "system").put("content", systemPrompt));
        messages.add(objectMapper.createObjectNode().put("role", "user").put("content", userPrompt));

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            String content = tryChat(body);
            if (content != null) {
                return Optional.of(content);
            }
            if (attempt < MAX_ATTEMPTS) {
                log.warn("OpenRouter produced unusable output (attempt {}/{}); retrying", attempt, MAX_ATTEMPTS);
                sleepBackoff(attempt);
            }
        }
        return Optional.empty();
    }

    private String tryChat(ObjectNode body) {
        try {
            HttpResponse<String> response = send(body, true);
            if (response.statusCode() == 400 && hasResponseFormat(body)) {
                log.warn("OpenRouter model {} rejected response_format; retrying without it", model);
                body.remove("response_format");
                response = send(body, false);
            }
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String content = extractContent(response.body());
                if (!content.isBlank()) {
                    return content;
                }
                log.warn("OpenRouter returned an empty or unexpected response");
            } else if (RETRYABLE_STATUS.contains(response.statusCode())) {
                log.warn("OpenRouter returned {} (retryable)", response.statusCode());
            } else {
                log.error("OpenRouter API returned {}: {}", response.statusCode(), truncate(response.body()));
            }
        } catch (IOException e) {
            log.warn("OpenRouter request failed: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Failed to call OpenRouter for AI recommendations", e);
        }
        return null;
    }

    private String extractContent(String responseBody) {
        try {
            JsonNode content = objectMapper.readTree(responseBody)
                    .path("choices").path(0).path("message").path("content");
            if (content.isMissingNode()) {
                return "";
            }
            String text = content.asText();
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start < 0 || end <= start) {
                return "";
            }
            String json = text.substring(start, end + 1);
            objectMapper.readTree(json);
            return json;
        } catch (Exception e) {
            return "";
        }
    }

    private void sleepBackoff(int attempt) {
        try {
            Thread.sleep(attempt * 2000L);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private HttpResponse<String> send(ObjectNode body, boolean includeFormat) throws Exception {
        if (includeFormat) {
            body.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));
        }
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + CHAT_PATH))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private boolean hasResponseFormat(ObjectNode body) {
        return body.has("response_format");
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 500 ? value.substring(0, 500) + "..." : value;
    }
}
