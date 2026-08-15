package com.embos.repository;

import com.embos.entity.EventAiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventAiInsightRepository extends JpaRepository<EventAiInsight, Long> {

    Optional<EventAiInsight> findByEventId(Long eventId);
}
