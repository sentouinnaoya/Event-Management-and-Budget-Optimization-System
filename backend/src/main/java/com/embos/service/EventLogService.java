package com.embos.service;

import com.embos.dto.EventLogDtos;
import com.embos.entity.Event;
import com.embos.entity.EventLog;
import com.embos.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventLogService {

    private final EventLogRepository eventLogRepository;

    @Transactional
    public void log(Event event, String action, String message, String actor) {
        EventLog entry = EventLog.builder()
                .event(event)
                .action(action)
                .message(message)
                .actor(actor)
                .createdAt(LocalDateTime.now())
                .build();
        eventLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<EventLogDtos.Response> list(Event event) {
        return eventLogRepository.findAllByEventIdOrderByCreatedAtDesc(event.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    private EventLogDtos.Response toResponse(EventLog entry) {
        return new EventLogDtos.Response(
                entry.getId(), entry.getAction(), entry.getMessage(), entry.getActor(), entry.getCreatedAt());
    }
}
