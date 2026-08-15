package com.embos.repository;

import com.embos.entity.Guest;
import com.embos.entity.enums.GuestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface GuestRepository extends JpaRepository<Guest, Long> {

    List<Guest> findAllByEventIdOrderByCreatedAtAsc(Long eventId);

    boolean existsByEventIdAndEmail(Long eventId, String email);

    long countByEventIdAndStatusIn(Long eventId, List<GuestStatus> statuses);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, GuestStatus status);

    long countByEventIdAndCreatedAtBetween(Long eventId, LocalDateTime start, LocalDateTime end);

    long countByEventIdAndStatusAndUpdatedAtBetween(Long eventId, GuestStatus status, LocalDateTime start, LocalDateTime end);

    List<Guest> findAllByEventIdAndStatusOrderByCreatedAtAsc(Long eventId, GuestStatus status);

    boolean existsByRegistrationCode(String registrationCode);
}
