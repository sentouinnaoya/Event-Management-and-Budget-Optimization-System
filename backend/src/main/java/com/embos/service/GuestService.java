package com.embos.service;

import com.embos.dto.GuestDtos;
import com.embos.entity.Event;
import com.embos.entity.Guest;
import com.embos.entity.enums.GuestStatus;
import com.embos.entity.enums.GuestType;
import com.embos.exception.BadRequestException;
import com.embos.exception.ConflictException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.GuestMapper;
import com.embos.repository.EventRepository;
import com.embos.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;
    private final EventRepository eventRepository;
    private final GuestMapper guestMapper;

    @Transactional(readOnly = true)
    public List<GuestDtos.Response> list(Event event) {
        return guestRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .map(guestMapper::toResponse)
                .toList();
    }

    @Transactional
    public GuestDtos.Response addManual(Event event, GuestDtos.Request request) {
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
                .createdAt(LocalDateTime.now())
                .build();
        return guestMapper.toResponse(guestRepository.save(guest));
    }

    @Transactional
    public GuestDtos.Response updateStatus(Event event, Long guestId, String status) {
        Guest guest = getGuest(event, guestId);
        guest.setStatus(parseStatus(status));
        guest.setUpdatedAt(LocalDateTime.now());
        return guestMapper.toResponse(guestRepository.save(guest));
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
        long registered = guestRepository.countByEventIdAndStatusIn(
                event.getId(), List.of(GuestStatus.REGISTERED, GuestStatus.APPROVED, GuestStatus.ATTENDED));
        return new GuestDtos.PublicEventResponse(
                event.getId(), event.getName(), event.getDescription(), event.getDate(),
                event.getVenue(), event.getCapacity(), event.getRegistrationDeadline(),
                event.getStatus().name(), registered);
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
        return guestMapper.toResponse(guestRepository.save(guest));
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
