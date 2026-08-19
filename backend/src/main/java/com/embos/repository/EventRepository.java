package com.embos.repository;

import com.embos.entity.Event;
import com.embos.entity.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findAllByOrganizerIdOrderByCreatedAtDesc(Long organizerId);

    List<Event> findAllByOrganizerIdAndStatusOrderByCreatedAtDesc(Long organizerId, EventStatus status);

    List<Event> findAllByStatusOrderByCreatedAtDesc(EventStatus status);

    List<Event> findAllByOrderByCreatedAtDesc();

    List<Event> findAllByStatusInOrderByDateAsc(Collection<EventStatus> statuses);

    Optional<Event> findByRegistrationToken(String registrationToken);

    long countByOrganizerId(Long organizerId);

    long countByStatus(EventStatus status);

    long countByStatusIn(Collection<EventStatus> statuses);

    @Query("SELECT COALESCE(SUM(e.capacity), 0) FROM Event e")
    long sumCapacity();

    @Query("SELECT COUNT(e) FROM Event e WHERE e.createdAt >= :start AND e.createdAt < :end")
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
