package com.embos.config;

import com.embos.entity.User;
import com.embos.entity.enums.UserRole;
import com.embos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@embos.com")) {
            userRepository.save(User.builder()
                    .email("admin@embos.com")
                    .fullName("System Admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        if (!userRepository.existsByEmail("organizer@embos.com")) {
            userRepository.save(User.builder()
                    .email("organizer@embos.com")
                    .fullName("Demo Organizer")
                    .password(passwordEncoder.encode("organizer123"))
                    .role(UserRole.ORGANIZER)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
    }
}
