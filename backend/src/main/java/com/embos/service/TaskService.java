package com.embos.service;

import com.embos.dto.TaskDtos;
import com.embos.entity.Event;
import com.embos.entity.Staff;
import com.embos.entity.Task;
import com.embos.entity.enums.Priority;
import com.embos.entity.enums.TaskStatus;
import com.embos.event.TaskAssignedEvent;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.TaskMapper;
import com.embos.repository.TaskRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final StaffService staffService;
    private final TaskMapper taskMapper;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<TaskDtos.Response> list(Event event) {
        return taskRepository.findAllByEventIdOrderByDueDateAsc(event.getId()).stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Transactional
    public TaskDtos.Response create(Event event, TaskDtos.Request request) {
        Staff staff = request.assignedStaffId() == null
                ? null
                : staffService.getStaff(event, request.assignedStaffId());
        TaskStatus status = parseStatus(request.status());
        Task task = Task.builder()
                .event(event)
                .title(request.title().trim())
                .description(request.description())
                .assignedStaff(staff)
                .dueDate(request.dueDate())
                .priority(parsePriority(request.priority()))
                .status(status)
                .completedAt(status == TaskStatus.DONE ? LocalDateTime.now() : null)
                .createdAt(LocalDateTime.now())
                .build();
        Task saved = taskRepository.save(task);
        if (saved.getAssignedStaff() != null) {
            eventPublisher.publishEvent(new TaskAssignedEvent(
                    event.getId(), event.getOrganizer().getId(), event.getName(),
                    saved.getTitle(), saved.getAssignedStaff().getName()));
        }
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "TASK_CREATED", "Task", saved.getId(), saved.getTitle(),
                "Created task" + (saved.getAssignedStaff() != null ? " assigned to " + saved.getAssignedStaff().getName() : ""));
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public TaskDtos.Response update(Event event, Long taskId, TaskDtos.Request request) {
        Task task = getTask(event, taskId);
        Staff staff = request.assignedStaffId() == null
                ? null
                : staffService.getStaff(event, request.assignedStaffId());
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setAssignedStaff(staff);
        task.setDueDate(request.dueDate());
        task.setPriority(parsePriority(request.priority()));
        applyStatus(task, parseStatus(request.status()));
        Task saved = taskRepository.save(task);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "TASK_UPDATED", "Task", saved.getId(), saved.getTitle(),
                "Updated task");
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public TaskDtos.Response updateStatus(Event event, Long taskId, String status) {
        Task task = getTask(event, taskId);
        applyStatus(task, parseStatus(status));
        Task saved = taskRepository.save(task);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "TASK_STATUS_CHANGED", "Task", saved.getId(), saved.getTitle(),
                "Status changed to " + status.toUpperCase());
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Event event, Long taskId) {
        Task task = getTask(event, taskId);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "TASK_DELETED", "Task", task.getId(), task.getTitle(),
                "Deleted task");
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public Task getTask(Event event, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        if (!task.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Task not found");
        }
        return task;
    }

    private Priority parsePriority(String priority) {
        try {
            return Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + priority);
        }
    }

    private TaskStatus parseStatus(String status) {
        try {
            return TaskStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid task status: " + status);
        }
    }

    private void applyStatus(Task task, TaskStatus status) {
        task.setStatus(status);
        if (status == TaskStatus.DONE) {
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }
        } else {
            task.setCompletedAt(null);
        }
    }
}
