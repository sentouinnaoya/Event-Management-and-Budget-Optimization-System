package com.embos.service;

import com.embos.dto.EventBackupDtos;
import com.embos.entity.Event;
import com.embos.entity.EventBackup;
import com.embos.repository.EventBackupRepository;
import com.embos.security.SecurityUtils;
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
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Optional<EventBackupDtos.Response> get(Event event) {
        return eventBackupRepository.findByEventId(event.getId())
                .map(this::toResponse);
    }

    @Transactional
    public EventBackupDtos.Response upsert(Event event, EventBackupDtos.Request request, String actor) {
        EventService.assertNotLocked(event);
        EventBackup backup = eventBackupRepository.findByEventId(event.getId()).orElse(null);
        boolean created = backup == null;
        if (backup == null) {
            backup = EventBackup.builder().event(event).build();
        }
        backup.setName(trimToNull(request.name()));
        backup.setBackupVenue(trimToNull(request.backupVenue()));
        backup.setBackupDate(request.backupDate());
        backup.setBackupCapacity(request.backupCapacity());
        backup.setContingencyBudget(request.contingencyBudget());
        backup.setBackupVendors(trimToNull(request.backupVendors()));
        backup.setNotes(trimToNull(request.notes()));
        backup.setUpdatedAt(LocalDateTime.now());
        EventBackup saved = eventBackupRepository.save(backup);
        eventLogService.log(event, "BACKUP_UPDATED",
                created ? "Backup plan created" : "Backup plan updated", actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "BACKUP_UPDATED", "EventBackup", saved.getId(), event.getName(),
                created ? "Created backup plan" : "Updated backup plan");
        return toResponse(saved);
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
                backup.getName(),
                backup.getBackupVenue(),
                backup.getBackupDate(),
                backup.getBackupCapacity(),
                backup.getContingencyBudget(),
                backup.getBackupVendors(),
                backup.getNotes(),
                backup.getUpdatedAt() == null ? null : backup.getUpdatedAt().toLocalDate());
    }
}
