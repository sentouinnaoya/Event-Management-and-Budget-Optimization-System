package com.embos.service;

import com.embos.dto.EventDtos;
import com.embos.entity.Event;
import com.embos.entity.User;
import com.embos.entity.enums.EventStatus;
import com.embos.event.EventStatusChangedEvent;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.EventMapper;
import com.embos.repository.EventRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final EventLogService eventLogService;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    private static final Map<EventStatus, Set<EventStatus>> TRANSITIONS = new EnumMap<>(EventStatus.class);
    static {
        TRANSITIONS.put(EventStatus.DRAFT, Set.of(EventStatus.PUBLISHED, EventStatus.FAILED, EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.PUBLISHED, Set.of(EventStatus.ONGOING, EventStatus.SUSPENDED, EventStatus.FAILED, EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.ONGOING, Set.of(EventStatus.COMPLETED, EventStatus.SUSPENDED, EventStatus.FAILED, EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.SUSPENDED, Set.of(EventStatus.PUBLISHED, EventStatus.ONGOING, EventStatus.FAILED, EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.COMPLETED, Set.of(EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.FAILED, Set.of(EventStatus.ARCHIVED));
        TRANSITIONS.put(EventStatus.ARCHIVED, Set.of());
    }

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
                .durationInDays(duration(request.durationInDays()))
                .venue(request.venue().trim())
                .capacity(request.capacity())
                .registrationDeadline(request.registrationDeadline())
                .eventType(defaultEventType(request.eventType()))
                .startTime(request.startTime())
                .endTime(request.endTime())
                .contactEmail(request.contactEmail() == null || request.contactEmail().isBlank() ? null : request.contactEmail().trim())
                .address(request.address() == null || request.address().isBlank() ? null : request.address().trim())
                .status(EventStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Event saved = eventRepository.save(event);
        auditLogService.log(currentUser.getId(), currentUser.getFullName(), currentUser.getRole().name(),
                "EVENT_CREATED", "Event", saved.getId(), saved.getName(), "Created event");
        return eventMapper.toResponse(saved);
    }

    @Transactional
    public EventDtos.Response update(Long id, User currentUser, EventDtos.Request request) {
        Event event = getOwnedEvent(id, currentUser);
        validateDates(request);
        event.setName(request.name().trim());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setDurationInDays(duration(request.durationInDays()));
        event.setVenue(request.venue().trim());
        event.setCapacity(request.capacity());
        event.setRegistrationDeadline(request.registrationDeadline());
        event.setEventType(defaultEventType(request.eventType()));
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setContactEmail(request.contactEmail() == null || request.contactEmail().isBlank() ? null : request.contactEmail().trim());
        event.setAddress(request.address() == null || request.address().isBlank() ? null : request.address().trim());
        event.setUpdatedAt(LocalDateTime.now());
        Event saved = eventRepository.save(event);
        auditLogService.log(currentUser.getId(), currentUser.getFullName(), currentUser.getRole().name(),
                "EVENT_UPDATED", "Event", saved.getId(), saved.getName(), "Updated event");
        return eventMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, User currentUser) {
        Event event = getOwnedEvent(id, currentUser);
        auditLogService.log(currentUser.getId(), currentUser.getFullName(), currentUser.getRole().name(),
                "EVENT_DELETED", "Event", event.getId(), event.getName(), "Deleted event");
        eventRepository.delete(event);
    }

    @Transactional
    public EventDtos.Response publish(Long id, User currentUser) {
        Event event = getOwnedEvent(id, currentUser);
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only draft or published events can be published");
        }
        EventStatus previous = event.getStatus();
        ensureToken(event);
        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(LocalDateTime.now());
        EventDtos.Response response = eventMapper.toResponse(eventRepository.save(event));
        eventLogService.log(event, "PUBLISHED", "Event published", currentUser.getFullName());
        auditLogService.log(currentUser.getId(), currentUser.getFullName(), currentUser.getRole().name(),
                "EVENT_PUBLISHED", "Event", event.getId(), event.getName(), "Event published");
        publishStatusChanged(event, previous, EventStatus.PUBLISHED);
        return response;
    }

    @Transactional
    public EventDtos.Response changeStatus(Long id, User currentUser, String status, String reason) {
        Event event = getOwnedEvent(id, currentUser);
        EventStatus newStatus = parseStatus(status);
        if (newStatus == null) {
            throw new BadRequestException("Invalid status: " + status);
        }
        EventStatus current = event.getStatus();
        if (newStatus == current) {
            throw new BadRequestException("Event is already " + current.name());
        }
        if (!TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new BadRequestException(
                    "Cannot change event from " + current + " to " + newStatus);
        }
        boolean requiresReason = newStatus == EventStatus.SUSPENDED || newStatus == EventStatus.FAILED;
        if (requiresReason && (reason == null || reason.isBlank())) {
            String verb = newStatus == EventStatus.SUSPENDED ? "suspending" : "failing";
            throw new BadRequestException("A reason is required when " + verb + " an event");
        }
        if (newStatus == EventStatus.PUBLISHED) {
            ensureToken(event);
        }
        event.setStatus(newStatus);
        event.setUpdatedAt(LocalDateTime.now());
        EventDtos.Response response = eventMapper.toResponse(eventRepository.save(event));
        String message = "Status changed from " + current + " to " + newStatus
                + (reason != null && !reason.isBlank() ? " — " + reason : "");
        eventLogService.log(event, "STATUS_CHANGED", message, currentUser.getFullName());
        auditLogService.log(currentUser.getId(), currentUser.getFullName(), currentUser.getRole().name(),
                "EVENT_STATUS_CHANGED", "Event", event.getId(), event.getName(), message);
        publishStatusChanged(event, current, newStatus);
        return response;
    }

    private void publishStatusChanged(Event event, EventStatus from, EventStatus to) {
        if (from == to) {
            return;
        }
        eventPublisher.publishEvent(new EventStatusChangedEvent(
                event.getId(), event.getOrganizer().getId(), event.getName(),
                from.name(), to.name()));
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

    private int duration(Integer durationInDays) {
        return durationInDays == null ? 1 : durationInDays;
    }

    private String defaultEventType(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return "Other";
        }
        return eventType.trim();
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
