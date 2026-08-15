package com.embos.repository;

import com.embos.entity.RecoveryPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecoveryPointRepository extends JpaRepository<RecoveryPoint, Long> {

    List<RecoveryPoint> findAllByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<RecoveryPoint> findByIdAndEventId(Long id, Long eventId);
}
