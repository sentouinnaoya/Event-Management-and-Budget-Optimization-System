package com.embos.service;

import com.embos.dto.EventDtos;
import com.embos.dto.RecoveryPointDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Event;
import com.embos.entity.EventBackup;
import com.embos.entity.Guest;
import com.embos.entity.RecoveryPoint;
import com.embos.entity.Staff;
import com.embos.entity.Task;
import com.embos.entity.Vendor;
import com.embos.entity.enums.EventStatus;
import com.embos.entity.enums.GuestStatus;
import com.embos.entity.enums.GuestType;
import com.embos.entity.enums.Priority;
import com.embos.entity.enums.TaskStatus;
import com.embos.entity.enums.VendorStatus;
import com.embos.event.RecoveryPointRestoredEvent;
import com.embos.exception.NotFoundException;
import com.embos.repository.BudgetCategoryRepository;
import com.embos.repository.EventBackupRepository;
import com.embos.repository.EventRepository;
import com.embos.repository.GuestRepository;
import com.embos.repository.RecoveryPointRepository;
import com.embos.security.SecurityUtils;
import com.embos.repository.StaffRepository;
import com.embos.repository.TaskRepository;
import com.embos.repository.VendorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecoveryPointService {

    private final RecoveryPointRepository recoveryPointRepository;
    private final EventRepository eventRepository;
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final VendorRepository vendorRepository;
    private final StaffRepository staffRepository;
    private final TaskRepository taskRepository;
    private final EventBackupRepository eventBackupRepository;
    private final GuestRepository guestRepository;
    private final GuestService guestService;
    private final EventLogService eventLogService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RecoveryPointDtos.Response create(Event event, String label, String actor) {
        EventService.assertNotLocked(event);
        EventBackup backup = eventBackupRepository.findByEventId(event.getId()).orElse(null);
        RecoveryData data = new RecoveryData(
                event.getName(),
                event.getDescription(),
                event.getDate(),
                event.getDurationInDays() == null ? 1 : event.getDurationInDays(),
                event.getVenue(),
                event.getCapacity(),
                event.getRegistrationDeadline(),
                event.getEventType(),
                event.getContactEmail(),
                backup == null ? null : backup.getBackupVenue(),
                backup == null ? null : backup.getBackupDate(),
                backup == null ? null : backup.getBackupCapacity(),
                backup == null ? null : backup.getContingencyBudget(),
                backup == null ? null : backup.getBackupVendors(),
                backup == null ? null : backup.getNotes(),
                budgetCategoryRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                        .map(c -> new CategoryData(c.getName(), c.getAllocatedAmount(), c.getAlertThresholdPct(), c.getPriority()))
                        .toList(),
                vendorRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                        .map(v -> new VendorData(v.getName(), v.getServiceType(), v.getContactPerson(),
                                v.getEmail(), v.getPhone(), v.getAssignedAmount(), v.getStatus().name()))
                        .toList(),
                staffRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                        .map(s -> new StaffData(s.getName(), s.getResponsibility(), s.getPhone()))
                        .toList(),
                taskRepository.findAllByEventIdOrderByDueDateAsc(event.getId()).stream()
                        .filter(t -> t.getStatus() != TaskStatus.DONE)
                        .map(t -> new TaskData(t.getTitle(), t.getDescription(),
                                t.getAssignedStaff() == null ? null : t.getAssignedStaff().getName(),
                                t.getDueDate(), t.getPriority().name(), t.getStatus().name()))
                        .toList(),
                guestRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                        .map(g -> new GuestData(g.getName(), g.getEmail(), g.getPhone(),
                                g.getGuestType().name(), g.getStatus().name()))
                        .toList());
        RecoveryPoint recoveryPoint = RecoveryPoint.builder()
                .event(event)
                .label(label.trim())
                .data(write(data))
                .createdAt(LocalDateTime.now())
                .build();
        RecoveryPoint saved = recoveryPointRepository.save(recoveryPoint);
        eventLogService.log(event, "RECOVERY_POINT_CREATED", "Recovery point created: " + saved.getLabel(), actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "RECOVERY_POINT_CREATED", "RecoveryPoint", saved.getId(), saved.getLabel(),
                "Created recovery point: " + saved.getLabel());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RecoveryPointDtos.Response> list(Event event) {
        return recoveryPointRepository.findAllByEventIdOrderByCreatedAtDesc(event.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Event event, Long recoveryPointId, String actor) {
        EventService.assertNotLocked(event);
        RecoveryPoint recoveryPoint = recoveryPointRepository.findByIdAndEventId(recoveryPointId, event.getId())
                .orElseThrow(() -> new NotFoundException("Draft not found"));
        eventLogService.log(event, "RECOVERY_POINT_DELETED", "Recovery point deleted: " + recoveryPoint.getLabel(), actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "RECOVERY_POINT_DELETED", "RecoveryPoint", recoveryPoint.getId(), recoveryPoint.getLabel(),
                "Deleted recovery point: " + recoveryPoint.getLabel());
        recoveryPointRepository.delete(recoveryPoint);
    }

    @Transactional
    public EventDtos.Response restore(Event source, Long recoveryPointId, String actor) {
        RecoveryPoint recoveryPoint = recoveryPointRepository.findByIdAndEventId(recoveryPointId, source.getId())
                .orElseThrow(() -> new NotFoundException("Recovery point not found"));
        RecoveryData data = read(recoveryPoint.getData());

        String venue = data.venue();
        LocalDate date = data.date();
        Integer capacity = data.capacity();
        if (data.backupVenue() != null && !data.backupVenue().isBlank()) {
            venue = data.backupVenue();
        }
        if (data.backupDate() != null) {
            date = data.backupDate();
        }
        if (data.backupCapacity() != null) {
            capacity = data.backupCapacity();
        }

        Event newEvent = Event.builder()
                .organizer(source.getOrganizer())
                .name(data.name())
                .description(data.description())
                .date(date)
                .durationInDays(data.durationInDays() == null ? 1 : data.durationInDays())
                .venue(venue)
                .capacity(capacity)
                .registrationDeadline(data.registrationDeadline())
                .eventType(data.eventType())
                .contactEmail(data.contactEmail())
                .status(EventStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<BudgetCategory> categories = new ArrayList<>();
        for (CategoryData c : data.budgetCategories()) {
            categories.add(BudgetCategory.builder()
                    .event(newEvent)
                    .name(c.name())
                    .allocatedAmount(c.allocatedAmount())
                    .alertThresholdPct(c.alertThresholdPct())
                    .priority(BudgetService.normalizePriority(c.priority()))
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        newEvent.setBudgetCategories(categories);

        List<Vendor> vendors = new ArrayList<>();
        for (VendorData v : data.vendors()) {
            vendors.add(Vendor.builder()
                    .event(newEvent)
                    .name(v.name())
                    .serviceType(v.serviceType())
                    .contactPerson(v.contactPerson())
                    .email(v.email())
                    .phone(v.phone())
                    .assignedAmount(v.assignedAmount())
                    .status(parseVendorStatus(v.status()))
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        newEvent.setVendors(vendors);

        List<Staff> staff = new ArrayList<>();
        Map<String, Staff> staffByName = new HashMap<>();
        for (StaffData s : data.staff()) {
            Staff member = Staff.builder()
                    .event(newEvent)
                    .name(s.name())
                    .responsibility(s.responsibility())
                    .phone(s.phone())
                    .createdAt(LocalDateTime.now())
                    .build();
            staff.add(member);
            staffByName.put(s.name(), member);
        }
        newEvent.setStaff(staff);

        List<Task> tasks = new ArrayList<>();
        for (TaskData t : data.tasks()) {
            tasks.add(Task.builder()
                    .event(newEvent)
                    .title(t.title())
                    .description(t.description())
                    .assignedStaff(t.assignedStaffName() == null ? null : staffByName.get(t.assignedStaffName()))
                    .dueDate(t.dueDate())
                    .priority(parsePriority(t.priority()))
                    .status(parseTaskStatus(t.status()))
                    .completedAt(null)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        newEvent.setTasks(tasks);

        if (data.guests() != null) {
            List<Guest> guests = new ArrayList<>();
            for (GuestData g : data.guests()) {
                guests.add(Guest.builder()
                        .event(newEvent)
                        .name(g.name())
                        .email(g.email())
                        .phone(g.phone())
                        .guestType(parseGuestType(g.guestType()))
                        .status(parseGuestStatus(g.status()))
                        .registrationCode(guestService.generateUniqueCode())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            newEvent.setGuests(guests);
        }

        Event saved = eventRepository.save(newEvent);

        if (data.contingencyBudget() != null || data.backupVendors() != null || data.notes() != null) {
            EventBackup backup = EventBackup.builder()
                    .event(saved)
                    .contingencyBudget(data.contingencyBudget())
                    .backupVendors(data.backupVendors())
                    .notes(data.notes())
                    .updatedAt(LocalDateTime.now())
                    .build();
            eventBackupRepository.save(backup);
        }

        recoveryPoint.setRestoredEventId(saved.getId());
        recoveryPoint.setRestoredAt(LocalDateTime.now());
        recoveryPointRepository.save(recoveryPoint);

        eventLogService.log(source, "RECOVERY_POINT_RESTORED",
                "Recovery point restored to new event: " + saved.getName(), actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "RECOVERY_POINT_RESTORED", "RecoveryPoint", recoveryPoint.getId(), recoveryPoint.getLabel(),
                "Restored recovery point to new event: " + saved.getName());
        eventPublisher.publishEvent(new RecoveryPointRestoredEvent(
                source.getId(), source.getOrganizer().getId(), source.getName(), saved.getId()));
        return toEventResponse(saved);
    }

    private String write(RecoveryData data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize recovery point", e);
        }
    }

    private RecoveryData read(String json) {
        try {
            return objectMapper.readValue(json, RecoveryData.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize recovery point", e);
        }
    }

    private VendorStatus parseVendorStatus(String status) {
        try {
            return VendorStatus.valueOf(status == null ? "ASSIGNED" : status);
        } catch (IllegalArgumentException e) {
            return VendorStatus.ASSIGNED;
        }
    }

    private Priority parsePriority(String priority) {
        try {
            return Priority.valueOf(priority);
        } catch (IllegalArgumentException e) {
            return Priority.MEDIUM;
        }
    }

    private TaskStatus parseTaskStatus(String status) {
        try {
            return TaskStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            return TaskStatus.TODO;
        }
    }

    private GuestType parseGuestType(String type) {
        try {
            return GuestType.valueOf(type);
        } catch (IllegalArgumentException e) {
            return GuestType.ONLINE;
        }
    }

    private GuestStatus parseGuestStatus(String status) {
        try {
            return GuestStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            return GuestStatus.REGISTERED;
        }
    }

    private RecoveryPointDtos.Response toResponse(RecoveryPoint recoveryPoint) {
        return new RecoveryPointDtos.Response(
                recoveryPoint.getId(), recoveryPoint.getLabel(),
                recoveryPoint.getRestoredEventId(), recoveryPoint.getRestoredAt(), recoveryPoint.getCreatedAt());
    }

    private EventDtos.Response toEventResponse(Event event) {
        return new EventDtos.Response(
                event.getId(), event.getName(), event.getDescription(), event.getDate(),
                event.getDurationInDays(), event.getVenue(), event.getCapacity(),
                event.getRegistrationDeadline(), event.getEventType(),
                event.getStartTime(), event.getEndTime(), event.getContactEmail(), event.getAddress(),
                event.getStatus().name(), event.getRegistrationToken(),
                event.getOrganizer().getFullName(), event.getCreatedAt(), event.getUpdatedAt());
    }

    record RecoveryData(
            String name,
            String description,
            LocalDate date,
            Integer durationInDays,
            String venue,
            Integer capacity,
            LocalDate registrationDeadline,
            String eventType,
            String contactEmail,
            String backupVenue,
            LocalDate backupDate,
            Integer backupCapacity,
            BigDecimal contingencyBudget,
            String backupVendors,
            String notes,
            List<CategoryData> budgetCategories,
            List<VendorData> vendors,
            List<StaffData> staff,
            List<TaskData> tasks,
            List<GuestData> guests) {
    }

    record CategoryData(String name, BigDecimal allocatedAmount, BigDecimal alertThresholdPct, Integer priority) {
    }

    record VendorData(String name, String serviceType, String contactPerson, String email, String phone,
                      BigDecimal assignedAmount, String status) {
    }

    record StaffData(String name, String responsibility, String phone) {
    }

    record TaskData(String title, String description, String assignedStaffName, LocalDate dueDate,
                    String priority, String status) {
    }

    record GuestData(String name, String email, String phone, String guestType, String status) {
    }
}
