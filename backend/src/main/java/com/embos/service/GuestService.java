package com.embos.service;

import com.embos.dto.GuestDtos;
import com.embos.entity.Event;
import com.embos.entity.Guest;
import com.embos.entity.enums.EventStatus;
import com.embos.entity.enums.GuestStatus;
import com.embos.entity.enums.GuestType;
import com.embos.event.GuestRegisteredEvent;
import com.embos.event.GuestStatusChangedEvent;
import com.embos.exception.BadRequestException;
import com.embos.exception.ConflictException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.GuestMapper;
import com.embos.repository.EventRepository;
import com.embos.repository.GuestRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final GuestRepository guestRepository;
    private final EventRepository eventRepository;
    private final GuestMapper guestMapper;
    private final EventLogService eventLogService;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<GuestDtos.Response> list(Event event) {
        return guestRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .map(guestMapper::toResponse)
                .toList();
    }

    @Transactional
    public GuestDtos.Response addManual(Event event, GuestDtos.Request request, String actor) {
        EventService.assertNotLocked(event);
        String email = request.email().trim().toLowerCase();
        if (guestRepository.existsByEventIdAndEmail(event.getId(), email)) {
            throw new ConflictException("A guest with this email is already registered");
        }
        Guest guest = Guest.builder()
                .event(event)
                .name(request.name().trim())
                .email(email)
                .phone(request.phone())
                .guestType(parseType(request.guestType()))
                .status(GuestStatus.APPROVED)
                .registrationCode(generateUniqueCode())
                .createdAt(LocalDateTime.now())
                .build();
        Guest saved = guestRepository.save(guest);
        eventLogService.log(event, "GUEST_APPROVED",
                "Manually invited and approved " + saved.getName() + " (" + saved.getEmail() + ")", actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "GUEST_ADDED", "Guest", saved.getId(), saved.getName(),
                "Manually added guest " + saved.getEmail());
        eventPublisher.publishEvent(new GuestStatusChangedEvent(
                event.getId(), saved.getId(), saved.getName(), saved.getEmail(),
                event.getName(), event.getRegistrationToken(),
                saved.getRegistrationCode(), GuestStatus.APPROVED.name(),
                event.getDate(), event.getVenue()));
        return guestMapper.toResponse(saved);
    }

    @Transactional
    public GuestDtos.Response updateStatus(Event event, Long guestId, String status, String actor) {
        EventService.assertNotLocked(event);
        Guest guest = getGuest(event, guestId);
        GuestStatus newStatus = parseStatus(status);
        GuestStatus oldStatus = guest.getStatus();
        if (newStatus == GuestStatus.APPROVED && guest.getRegistrationCode() == null) {
            guest.setRegistrationCode(generateUniqueCode());
        }
        guest.setStatus(newStatus);
        guest.setUpdatedAt(LocalDateTime.now());
        GuestDtos.Response response = guestMapper.toResponse(guestRepository.save(guest));
        if (oldStatus != newStatus
                && (newStatus == GuestStatus.APPROVED || newStatus == GuestStatus.REJECTED)) {
            eventLogService.log(event, newStatus == GuestStatus.APPROVED ? "GUEST_APPROVED" : "GUEST_REJECTED",
                    (newStatus == GuestStatus.APPROVED ? "Approved" : "Rejected") + " guest "
                            + guest.getName() + " (" + guest.getEmail() + ")", actor);
            var u = SecurityUtils.currentUser();
            auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                    newStatus == GuestStatus.APPROVED ? "GUEST_APPROVED" : "GUEST_REJECTED",
                    "Guest", guest.getId(), guest.getName(),
                    (newStatus == GuestStatus.APPROVED ? "Approved" : "Rejected") + " guest " + guest.getEmail());
            eventPublisher.publishEvent(new GuestStatusChangedEvent(
                    event.getId(), guest.getId(), guest.getName(), guest.getEmail(),
                    event.getName(), event.getRegistrationToken(),
                    guest.getRegistrationCode(), newStatus.name(),
                    event.getDate(), event.getVenue()));
        }
        return response;
    }

    @Transactional(readOnly = true)
    public Guest getGuest(Event event, Long guestId) {
        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new NotFoundException("Guest not found"));
        if (!guest.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Guest not found");
        }
        return guest;
    }

    @Transactional(readOnly = true)
    public GuestDtos.PublicEventResponse publicEvent(String token) {
        Event event = eventRepository.findByRegistrationToken(token)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        return toPublicEventResponse(event);
    }

    @Transactional(readOnly = true)
    public List<GuestDtos.PublicEventResponse> listPublic() {
        return eventRepository.findAllByStatusInOrderByDateAsc(
                        List.of(EventStatus.PUBLISHED, EventStatus.ONGOING)).stream()
                .map(this::toPublicEventResponse)
                .toList();
    }

    private GuestDtos.PublicEventResponse toPublicEventResponse(Event event) {
        long registered = guestRepository.countByEventIdAndStatusIn(
                event.getId(), List.of(GuestStatus.REGISTERED, GuestStatus.APPROVED, GuestStatus.ATTENDED));
        return new GuestDtos.PublicEventResponse(
                event.getId(), event.getName(), event.getDescription(), event.getDate(),
                event.getVenue(), event.getCapacity(), event.getRegistrationDeadline(),
                event.getEventType(),
                event.getStartTime() == null ? null : event.getStartTime().toString(),
                event.getEndTime() == null ? null : event.getEndTime().toString(),
                event.getContactEmail(), event.getAddress(),
                event.getStatus().name(), registered, event.getRegistrationToken());
    }

    @Transactional
    public GuestDtos.Response registerPublic(String token, GuestDtos.PublicRegistrationRequest request) {
        Event event = eventRepository.findByRegistrationToken(token)
                .orElseThrow(() -> new NotFoundException("Event not found"));
        if (event.getStatus() != com.embos.entity.enums.EventStatus.PUBLISHED
                && event.getStatus() != com.embos.entity.enums.EventStatus.ONGOING) {
            throw new BadRequestException("Registrations are closed for this event");
        }
        if (event.getRegistrationDeadline() != null
                && LocalDate.now().isAfter(event.getRegistrationDeadline())) {
            throw new BadRequestException("The registration deadline for this event has passed");
        }
        String email = request.email().trim().toLowerCase();
        if (guestRepository.existsByEventIdAndEmail(event.getId(), email)) {
            throw new ConflictException("This email is already registered for the event");
        }
        long registered = guestRepository.countByEventIdAndStatusIn(
                event.getId(), List.of(GuestStatus.REGISTERED, GuestStatus.APPROVED, GuestStatus.ATTENDED));
        if (registered >= event.getCapacity()) {
            throw new ConflictException("The event is at full capacity");
        }
        Guest guest = Guest.builder()
                .event(event)
                .name(request.name().trim())
                .email(email)
                .phone(request.phone())
                .guestType(GuestType.ONLINE)
                .status(GuestStatus.REGISTERED)
                .createdAt(LocalDateTime.now())
                .build();
        Guest saved = guestRepository.save(guest);
        eventPublisher.publishEvent(new GuestRegisteredEvent(
                event.getId(), event.getOrganizer().getId(), event.getName(),
                saved.getName(), saved.getEmail()));
        return guestMapper.toResponse(saved);
    }

    String generateUniqueCode() {
        for (int i = 0; i < 20; i++) {
            String candidate = randomCode();
            if (!guestRepository.existsByRegistrationCode(candidate)) {
                return candidate;
            }
        }
        throw new ConflictException("Could not generate a unique registration code");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public long countRegistered(Event event) {
        return guestRepository.countByEventIdAndStatusIn(
                event.getId(), List.of(GuestStatus.REGISTERED, GuestStatus.APPROVED, GuestStatus.ATTENDED));
    }

    private GuestType parseType(String type) {
        try {
            return GuestType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid guest type: " + type);
        }
    }

    private GuestStatus parseStatus(String status) {
        try {
            return GuestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid guest status: " + status);
        }
    }
}
