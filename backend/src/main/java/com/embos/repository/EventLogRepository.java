package com.embos.repository;

import com.embos.entity.EventLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {

    List<EventLog> findAllByEventIdOrderByCreatedAtDesc(Long eventId);
}
