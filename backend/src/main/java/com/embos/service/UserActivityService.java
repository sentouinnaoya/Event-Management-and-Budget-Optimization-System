package com.embos.service;

import com.embos.dto.UserActivityDtos;
import com.embos.entity.User;
import com.embos.entity.enums.EventStatus;
import com.embos.entity.enums.TaskStatus;
import com.embos.repository.AuditLogRepository;
import com.embos.repository.EventRepository;
import com.embos.repository.ExpenseRepository;
import com.embos.repository.GuestRepository;
import com.embos.repository.NotificationRepository;
import com.embos.repository.TaskRepository;
import com.embos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;
    private final TaskRepository taskRepository;
    private final ExpenseRepository expenseRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<UserActivityDtos.UserSummary> listSummaries() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserActivityDtos.UserDetail getDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.embos.exception.NotFoundException("User not found"));
        return toDetail(user);
    }

    private UserActivityDtos.UserSummary toSummary(User user) {
        long eventCount = eventRepository.countByOrganizerId(user.getId());
        long guestCount = guestRepository.countByEventOrganizerId(user.getId());
        long taskCount = taskRepository.countByEventOrganizerId(user.getId());
        BigDecimal expenseTotal = expenseRepository.sumAmountByOrganizerId(user.getId());
        long auditLogCount = auditLogRepository.countByUserId(user.getId());
        long unreadNotifications = notificationRepository.countByRecipientIdAndReadFalse(user.getId());

        return new UserActivityDtos.UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt(),
                eventCount,
                guestCount,
                taskCount,
                expenseTotal,
                auditLogCount,
                unreadNotifications);
    }

    private UserActivityDtos.UserDetail toDetail(User user) {
        UserActivityDtos.UserSummary summary = toSummary(user);

        List<UserActivityDtos.EventStatusCount> eventBreakdown = new ArrayList<>();
        for (EventStatus status : EventStatus.values()) {
            long count = eventRepository.findAllByOrganizerIdAndStatusOrderByCreatedAtDesc(user.getId(), status).size();
            eventBreakdown.add(new UserActivityDtos.EventStatusCount(status.name(), count));
        }

        long tasksDone = 0;
        var userEvents = eventRepository.findAllByOrganizerIdOrderByCreatedAtDesc(user.getId());
        for (var evt : userEvents) {
            tasksDone += taskRepository.countByEventIdAndStatus(evt.getId(), TaskStatus.DONE);
        }

        long totalNotifications = notificationRepository.countByRecipientId(user.getId());

        List<UserActivityDtos.RecentAuditEntry> recentAuditLogs = auditLogRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 10))
                .getContent().stream()
                .map(log -> new UserActivityDtos.RecentAuditEntry(
                        log.getAction(),
                        log.getEntityType(),
                        log.getEntityName(),
                        log.getCreatedAt()))
                .toList();

        return new UserActivityDtos.UserDetail(
                summary.id(),
                summary.fullName(),
                summary.email(),
                summary.role(),
                summary.createdAt(),
                summary.eventCount(),
                eventBreakdown,
                summary.guestCount(),
                summary.taskCount(),
                tasksDone,
                summary.expenseTotal(),
                summary.auditLogCount(),
                totalNotifications,
                summary.unreadNotifications(),
                recentAuditLogs);
    }
}
