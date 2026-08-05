package com.embos.service;

import com.embos.dto.AuthDtos;
import com.embos.entity.User;
import com.embos.entity.enums.UserRole;
import com.embos.exception.ConflictException;
import com.embos.exception.NotFoundException;
import com.embos.repository.UserRepository;
import com.embos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password()));
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return toAuthResponse(user);
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered");
        }
        User user = User.builder()
                .email(email)
                .fullName(request.fullName().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(UserRole.ORGANIZER)
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);
        return toAuthResponse(user);
    }

    private AuthDtos.AuthResponse toAuthResponse(User user) {
        return new AuthDtos.AuthResponse(
                jwtService.generateToken(user),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name());
    }
}
