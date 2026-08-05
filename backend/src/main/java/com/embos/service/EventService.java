package com.embos.service;

import com.embos.dto.EventDtos;
import com.embos.entity.Event;
import com.embos.entity.User;
import com.embos.entity.enums.EventStatus;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.EventMapper;
import com.embos.repository.EventRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    @Transactional(readOnly = true)
    public List<EventDtos.Response> list(User currentUser, String status) {
        EventStatus filter = parseStatus(status);
        List<Event> events;
        if (SecurityUtils.isAdmin()) {
            events = filter == null
                    ? eventRepository.findAllByOrderByCreatedAtDesc()
                    : eventRepository.findAllByStatusOrderByCreatedAtDesc(filter);
        } else {
            events = filter == null
                    ? eventRepository.findAllByOrganizerIdOrderByCreatedAtDesc(currentUser.getId())
                    : eventRepository.findAllByOrganizerIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), filter);
        }
        return events.stream().map(eventMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EventDtos.Response get(Long id, User currentUser) {
        return eventMapper.toResponse(getOwnedEvent(id, currentUser));
    }

    @Transactional
    public EventDtos.Response create(User currentUser, EventDtos.Request request) {
        validateDates(request);
        Event event = Event.builder()
                .organizer(currentUser)
                .name(request.name().trim())
                .description(request.description())
                .date(request.date())
                .venue(request.venue().trim())
                .capacity(request.capacity())
                .registrationDeadline(request.registrationDeadline())
                .status(EventStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Transactional
    public EventDtos.Response update(Long id, User currentUser, EventDtos.Request request) {
        Event event = getOwnedEvent(id, currentUser);
        validateDates(request);
        event.setName(request.name().trim());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setVenue(request.venue().trim());
        event.setCapacity(request.capacity());
        event.setRegistrationDeadline(request.registrationDeadline());
        event.setUpdatedAt(LocalDateTime.now());
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Transactional
    public void delete(Long id, User currentUser) {
        Event event = getOwnedEvent(id, currentUser);
        eventRepository.delete(event);
    }

    @Transactional
    public EventDtos.Response publish(Long id, User currentUser) {
        Event event = getOwnedEvent(id, currentUser);
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only draft or published events can be published");
        }
        ensureToken(event);
        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(LocalDateTime.now());
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Transactional
    public EventDtos.Response changeStatus(Long id, User currentUser, String status) {
        Event event = getOwnedEvent(id, currentUser);
        EventStatus newStatus = parseStatus(status);
        if (newStatus == null) {
            throw new BadRequestException("Invalid status: " + status);
        }
        if (newStatus == EventStatus.PUBLISHED) {
            ensureToken(event);
        }
        event.setStatus(newStatus);
        event.setUpdatedAt(LocalDateTime.now());
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public Event getOwnedEvent(Long id, User currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (!SecurityUtils.isAdmin() && !event.getOrganizer().getId().equals(currentUser.getId())) {
            throw new NotFoundException("Event not found");
        }
        return event;
    }

    private void ensureToken(Event event) {
        if (event.getRegistrationToken() == null) {
            event.setRegistrationToken(UUID.randomUUID().toString().replace("-", ""));
        }
    }

    private void validateDates(EventDtos.Request request) {
        if (request.registrationDeadline() != null && request.registrationDeadline().isAfter(request.date())) {
            throw new BadRequestException("Registration deadline must be on or before the event date");
        }
    }

    private EventStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return EventStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
