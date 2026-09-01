package com.embos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${embos.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(parseOrigins(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Accepts the explicitly configured origins plus every localhost port, so the
     * dev/Next.js server never triggers "Invalid CORS request" no matter what port
     * it is opened on (3000, 3001, proxies, etc.).
     */
    private static List<String> parseOrigins(String raw) {
        List<String> result = new ArrayList<>();
        for (String part : raw.split(",")) {
            String origin = part.trim();
            if (!origin.isEmpty()) {
                result.add(origin);
            }
        }
        // Cover localhost on any port for local development.
        for (int port : new int[]{80, 443, 3000, 3001, 3002, 8080, 8081, 5173, 5174, 8000, 8001}) {
            result.add("http://localhost:" + port);
            result.add("http://127.0.0.1:" + port);
        }
        // Spring requires these be unique.
        return result.stream().distinct().toList();
    }
}
