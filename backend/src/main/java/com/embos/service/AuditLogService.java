package com.embos.service;

import com.embos.dto.AuditLogDtos;
import com.embos.entity.AuditLog;
import com.embos.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(Long userId, String userName, String userRole,
                    String action, String entityType, Long entityId,
                    String entityName, String details) {
        AuditLog entry = AuditLog.builder()
                .userId(userId)
                .userName(userName)
                .userRole(userRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public AuditLogDtos.PageResponse list(int page, int size,
                                           String action, String entityType, Long userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result;

        if (userId != null && action != null && entityType != null) {
            result = auditLogRepository.findByUserIdAndActionAndEntityTypeOrderByCreatedAtDesc(userId, action, entityType, pageable);
        } else if (userId != null && action != null) {
            result = auditLogRepository.findByUserIdAndActionOrderByCreatedAtDesc(userId, action, pageable);
        } else if (userId != null && entityType != null) {
            result = auditLogRepository.findByUserIdAndEntityTypeOrderByCreatedAtDesc(userId, entityType, pageable);
        } else if (action != null && entityType != null) {
            result = auditLogRepository.findByActionAndEntityTypeOrderByCreatedAtDesc(action, entityType, pageable);
        } else if (userId != null) {
            result = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else if (action != null) {
            result = auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
        } else if (entityType != null) {
            result = auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
        } else {
            result = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public AuditLogDtos.Stats stats() {
        long totalLogs = auditLogRepository.count();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayLogs = auditLogRepository.findAll().stream()
                .filter(log -> log.getCreatedAt().isAfter(startOfDay))
                .count();

        List<AuditLogDtos.ActionCount> topActions = auditLogRepository.findAll().stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        AuditLog::getAction,
                        java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> new AuditLogDtos.ActionCount(e.getKey(), e.getValue()))
                .toList();

        List<AuditLogDtos.UserCount> topUsers = auditLogRepository.findAll().stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        AuditLog::getUserId,
                        java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> {
                    String userName = auditLogRepository.findAll().stream()
                            .filter(log -> log.getUserId().equals(e.getKey()))
                            .findFirst()
                            .map(AuditLog::getUserName)
                            .orElse("Unknown");
                    return new AuditLogDtos.UserCount(e.getKey(), userName, e.getValue());
                })
                .toList();

        return new AuditLogDtos.Stats(totalLogs, todayLogs, topActions, topUsers);
    }

    private AuditLogDtos.PageResponse toPageResponse(Page<AuditLog> page) {
        List<AuditLogDtos.Response> content = page.getContent().stream()
                .map(this::toResponse)
                .toList();
        return new AuditLogDtos.PageResponse(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    private AuditLogDtos.Response toResponse(AuditLog entry) {
        return new AuditLogDtos.Response(
                entry.getId(),
                entry.getUserId(),
                entry.getUserName(),
                entry.getUserRole(),
                entry.getAction(),
                entry.getEntityType(),
                entry.getEntityId(),
                entry.getEntityName(),
                entry.getDetails(),
                entry.getCreatedAt());
    }
}
