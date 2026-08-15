package com.embos.repository;

import com.embos.entity.Event;
import com.embos.entity.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
