package com.embos.controller;

import com.embos.dto.AuthDtos;
import com.embos.entity.User;
import com.embos.entity.enums.UserRole;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.UserMapper;
import com.embos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @GetMapping("/users")
    public ResponseEntity<List<AuthDtos.UserResponse>> users() {
        return ResponseEntity.ok(userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(userMapper::toResponse)
                .toList());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AuthDtos.UserResponse> changeRole(@PathVariable Long id, Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String role = body.get("role");
        if (role == null || role.isBlank()) {
            throw new BadRequestException("Role is required");
        }
        user.setRole(UserRole.valueOf(role.toUpperCase()));
        return ResponseEntity.ok(userMapper.toResponse(userRepository.save(user)));
    }
}
