package com.embos.repository;

import com.embos.entity.EventBackup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventBackupRepository extends JpaRepository<EventBackup, Long> {

    Optional<EventBackup> findByEventId(Long eventId);
}
