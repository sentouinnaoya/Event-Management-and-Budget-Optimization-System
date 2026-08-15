package com.embos.service;

import com.embos.dto.NotificationDtos;
import com.embos.entity.Notification;
import com.embos.entity.User;
import com.embos.event.BudgetExceededEvent;
import com.embos.event.EventStatusChangedEvent;
import com.embos.event.GuestRegisteredEvent;
import com.embos.event.RecoveryPointRestoredEvent;
import com.embos.event.TaskAssignedEvent;
import com.embos.repository.NotificationRepository;
import com.embos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notify(Long recipientId, Long eventId, String type, String title, String message) {
        Notification notification = Notification.builder()
                .recipient(userRepository.getReferenceById(recipientId))
                .eventId(eventId)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onGuestRegistered(GuestRegisteredEvent event) {
        notify(event.recipientId(), event.eventId(), "GUEST_REGISTERED", "New guest registered",
                event.guestName() + " (" + event.guestEmail() + ") registered for " + event.eventName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBudgetExceeded(BudgetExceededEvent event) {
        if (isPositive(event.categoryOvershoot())) {
            notify(event.recipientId(), event.eventId(), "BUDGET_CATEGORY_EXCEEDED", "Category over budget",
                    "Category '" + event.categoryName() + "' is over budget by "
                            + event.categoryOvershoot() + " for " + event.eventName());
        }
        if (isPositive(event.eventOvershoot())) {
            notify(event.recipientId(), event.eventId(), "BUDGET_EXCEEDED", "Event budget exceeded",
                    "The budget for " + event.eventName() + " is exceeded by " + event.eventOvershoot());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventStatusChanged(EventStatusChangedEvent event) {
        notify(event.recipientId(), event.eventId(), "EVENT_STATUS_CHANGED", "Event status changed",
                event.eventName() + " changed from " + event.fromStatus() + " to " + event.toStatus());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTaskAssigned(TaskAssignedEvent event) {
        notify(event.recipientId(), event.eventId(), "TASK_ASSIGNED", "Task assigned",
                "Task '" + event.taskTitle() + "' assigned to " + event.assigneeName() + " for " + event.eventName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onRecoveryPointRestored(RecoveryPointRestoredEvent event) {
        notify(event.recipientId(), event.eventId(), "RECOVERY_POINT_RESTORED", "Recovery point restored",
                "A recovery point for " + event.eventName() + " was restored to a new event (id "
                        + event.restoredEventId() + ")");
    }

    @Transactional(readOnly = true)
    public List<NotificationDtos.Response> list(User user) {
        return notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(Long id, User user) {
        notificationRepository.findByIdAndRecipientId(id, user.getId())
                .ifPresent(n -> n.setRead(true));
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.findAllByRecipientIdAndReadFalse(user.getId())
                .forEach(n -> n.setRead(true));
    }

    @Transactional
    public void delete(Long id, User user) {
        notificationRepository.deleteByIdAndRecipientId(id, user.getId());
    }

    @Transactional
    public void deleteAll(User user) {
        notificationRepository.deleteByRecipientId(user.getId());
    }

    private boolean isPositive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private NotificationDtos.Response toResponse(Notification notification) {
        return new NotificationDtos.Response(
                notification.getId(), notification.getEventId(), notification.getType(),
                notification.getTitle(), notification.getMessage(),
                notification.isRead(), notification.getCreatedAt());
    }
}
