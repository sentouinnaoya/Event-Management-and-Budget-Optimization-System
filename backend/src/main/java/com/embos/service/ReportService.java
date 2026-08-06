package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.dto.ExpenseDtos;
import com.embos.dto.ReportDtos;
import com.embos.entity.Event;
import com.embos.entity.enums.GuestStatus;
import com.embos.entity.enums.GuestType;
import com.embos.entity.enums.TaskStatus;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.EventMapper;
import com.embos.repository.EventRepository;
import com.embos.repository.GuestRepository;
import com.embos.repository.TaskRepository;
import com.embos.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BudgetService budgetService;
    private final ExpenseService expenseService;
    private final VendorService vendorService;
    private final StaffService staffService;
    private final TaskRepository taskRepository;
    private final GuestRepository guestRepository;
    private final VendorRepository vendorRepository;
    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    @Transactional(readOnly = true)
    public Object report(Event event, String type) {
        Event managedEvent = eventRepository.findById(event.getId())
                .orElseThrow(() -> new NotFoundException("Event not found"));
        return switch (type.toLowerCase()) {
            case "summary" -> summary(managedEvent);
            case "budget" -> budgetService.summary(managedEvent);
            case "expenses" -> expenseReport(managedEvent);
            case "vendors" -> vendorReport(managedEvent);
            case "staff" -> staffReport(managedEvent);
            case "attendance" -> attendanceReport(managedEvent);
            case "daily" -> daily(managedEvent, LocalDate.now());
            case "daily-overview" -> dailyOverview(managedEvent);
            default -> throw new BadRequestException("Unknown report type: " + type);
        };
    }

    private ReportDtos.SummaryReport summary(Event event) {
        BudgetDtos.SummaryResponse budget = budgetService.summary(event);
        return new ReportDtos.SummaryReport(
                eventMapper.toResponse(event),
                guestRepository.countByEventId(event.getId()),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.APPROVED),
                vendorService.list(event).size(),
                staffService.list(event).size(),
                taskRepository.countByEventId(event.getId()),
                taskRepository.countByEventIdAndStatus(event.getId(), TaskStatus.DONE),
                budget.totalAllocated(),
                budget.totalSpent(),
                budget.totalRemaining());
    }

    private ReportDtos.ExpenseReport expenseReport(Event event) {
        List<ExpenseDtos.Response> responses = expenseService.list(event);
        BigDecimal totalSpent = responses.stream()
                .map(ExpenseDtos.Response::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = responses.stream()
                .filter(r -> "PAID".equals(r.paymentStatus()))
                .map(ExpenseDtos.Response::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = totalSpent.subtract(totalPaid);
        return new ReportDtos.ExpenseReport(responses, totalSpent, totalPaid, totalPending);
    }

    private ReportDtos.VendorReport vendorReport(Event event) {
        BigDecimal totalAssigned = vendorService.list(event).stream()
                .map(com.embos.dto.VendorDtos.Response::assignedAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ReportDtos.VendorReport(vendorService.list(event), totalAssigned);
    }

    private ReportDtos.StaffReport staffReport(Event event) {
        return new ReportDtos.StaffReport(
                staffService.list(event),
                taskRepository.countByEventId(event.getId()),
                taskRepository.countByEventIdAndStatus(event.getId(), TaskStatus.DONE));
    }

    private ReportDtos.AttendanceReport attendanceReport(Event event) {
        Map<GuestType, Long> byTypeMap = new EnumMap<>(GuestType.class);
        for (GuestType type : GuestType.values()) {
            byTypeMap.put(type, 0L);
        }
        for (com.embos.entity.Guest guest : guestRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId())) {
            byTypeMap.merge(guest.getGuestType(), 1L, Long::sum);
        }
        Map<String, Long> byType = new java.util.LinkedHashMap<>();
        byTypeMap.forEach((k, v) -> byType.put(k.name(), v));
        return new ReportDtos.AttendanceReport(
                guestRepository.countByEventId(event.getId()),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.REGISTERED),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.APPROVED),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.REJECTED),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.ATTENDED),
                guestRepository.countByEventIdAndStatus(event.getId(), GuestStatus.ABSENT),
                byType);
    }

    @Transactional(readOnly = true)
    public ReportDtos.DailyReport daily(Event event, LocalDate date) {
        Event managedEvent = eventRepository.findById(event.getId())
                .orElseThrow(() -> new NotFoundException("Event not found"));
        int totalDays = duration(managedEvent);
        LocalDate start = managedEvent.getDate();
        LocalDate end = start.plusDays(totalDays - 1L);
        if (date.isBefore(start) || date.isAfter(end)) {
            throw new BadRequestException(
                    "Date must be within the event's " + totalDays + "-day range (" + start + " to " + end + ")");
        }
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<ExpenseDtos.Response> expenses = expenseService.list(managedEvent).stream()
                .filter(e -> e.expenseDate().equals(date))
                .toList();
        BigDecimal totalSpent = expenses.stream()
                .map(ExpenseDtos.Response::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long dayNumber = ChronoUnit.DAYS.between(start, date) + 1;
        return new ReportDtos.DailyReport(
                eventMapper.toResponse(managedEvent),
                date,
                (int) dayNumber,
                totalDays,
                expenses,
                totalSpent,
                expenses.size(),
                guestRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd),
                guestRepository.countByEventIdAndStatusAndUpdatedAtBetween(
                        event.getId(), GuestStatus.APPROVED, dayStart, dayEnd),
                guestRepository.countByEventIdAndStatusAndUpdatedAtBetween(
                        event.getId(), GuestStatus.ATTENDED, dayStart, dayEnd),
                guestRepository.countByEventIdAndStatusAndUpdatedAtBetween(
                        event.getId(), GuestStatus.ABSENT, dayStart, dayEnd),
                guestRepository.countByEventIdAndStatusAndUpdatedAtBetween(
                        event.getId(), GuestStatus.REJECTED, dayStart, dayEnd),
                taskRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd),
                taskRepository.countByEventIdAndDueDate(event.getId(), date),
                taskRepository.countByEventIdAndStatusAndCompletedAtBetween(
                        event.getId(), TaskStatus.DONE, dayStart, dayEnd),
                vendorRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd));
    }

    @Transactional(readOnly = true)
    public ReportDtos.DailyOverview dailyOverview(Event event) {
        Event managedEvent = eventRepository.findById(event.getId())
                .orElseThrow(() -> new NotFoundException("Event not found"));
        int totalDays = duration(managedEvent);
        List<ReportDtos.DailyDay> days = new ArrayList<>();
        LocalDate start = managedEvent.getDate();
        for (int i = 0; i < totalDays; i++) {
            LocalDate date = start.plusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            BigDecimal totalSpent = expenseService.list(managedEvent).stream()
                    .filter(e -> e.expenseDate().equals(date))
                    .map(ExpenseDtos.Response::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            days.add(new ReportDtos.DailyDay(
                    i + 1,
                    date,
                    totalSpent,
                    guestRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd),
                    taskRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd),
                    taskRepository.countByEventIdAndDueDate(event.getId(), date),
                    taskRepository.countByEventIdAndStatusAndCompletedAtBetween(
                            event.getId(), TaskStatus.DONE, dayStart, dayEnd),
                    vendorRepository.countByEventIdAndCreatedAtBetween(event.getId(), dayStart, dayEnd)));
        }
        return new ReportDtos.DailyOverview(eventMapper.toResponse(managedEvent), totalDays, days);
    }

    private int duration(Event event) {
        Integer durationInDays = event.getDurationInDays();
        return durationInDays == null ? 1 : durationInDays;
    }
}
