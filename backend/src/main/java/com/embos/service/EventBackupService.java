package com.embos.service;

import com.embos.dto.EventBackupDtos;
import com.embos.entity.Event;
import com.embos.entity.EventBackup;
import com.embos.repository.EventBackupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventBackupService {

    private final EventBackupRepository eventBackupRepository;
    private final EventLogService eventLogService;

    @Transactional(readOnly = true)
    public Optional<EventBackupDtos.Response> get(Event event) {
        return eventBackupRepository.findByEventId(event.getId())
                .map(this::toResponse);
    }

    @Transactional
    public EventBackupDtos.Response upsert(Event event, EventBackupDtos.Request request, String actor) {
        EventBackup backup = eventBackupRepository.findByEventId(event.getId()).orElse(null);
        boolean created = backup == null;
        if (backup == null) {
            backup = EventBackup.builder().event(event).build();
        }
        backup.setBackupVenue(trimToNull(request.backupVenue()));
        backup.setBackupDate(request.backupDate());
        backup.setBackupCapacity(request.backupCapacity());
        backup.setContingencyBudget(request.contingencyBudget());
        backup.setBackupVendors(trimToNull(request.backupVendors()));
        backup.setNotes(trimToNull(request.notes()));
        backup.setUpdatedAt(LocalDateTime.now());
        eventLogService.log(event, "BACKUP_UPDATED",
                created ? "Backup plan created" : "Backup plan updated", actor);
        return toResponse(eventBackupRepository.save(backup));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private EventBackupDtos.Response toResponse(EventBackup backup) {
        return new EventBackupDtos.Response(
                backup.getId(),
                backup.getBackupVenue(),
                backup.getBackupDate(),
                backup.getBackupCapacity(),
                backup.getContingencyBudget(),
                backup.getBackupVendors(),
                backup.getNotes(),
                backup.getUpdatedAt() == null ? null : backup.getUpdatedAt().toLocalDate());
    }
}
