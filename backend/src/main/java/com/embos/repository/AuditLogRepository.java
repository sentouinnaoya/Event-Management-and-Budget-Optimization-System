package com.embos.repository;

import com.embos.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    Page<AuditLog> findByUserIdAndActionOrderByCreatedAtDesc(Long userId, String action, Pageable pageable);

    Page<AuditLog> findByUserIdAndEntityTypeOrderByCreatedAtDesc(Long userId, String entityType, Pageable pageable);

    Page<AuditLog> findByActionAndEntityTypeOrderByCreatedAtDesc(String action, String entityType, Pageable pageable);

    Page<AuditLog> findByUserIdAndActionAndEntityTypeOrderByCreatedAtDesc(Long userId, String action, String entityType, Pageable pageable);

    long countByUserId(Long userId);

    long countByAction(String action);

    long countByEntityType(String entityType);
}
