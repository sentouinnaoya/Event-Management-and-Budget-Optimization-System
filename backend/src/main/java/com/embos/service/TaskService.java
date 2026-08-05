package com.embos.service;

import com.embos.dto.TaskDtos;
import com.embos.entity.Event;
import com.embos.entity.Staff;
import com.embos.entity.Task;
import com.embos.entity.enums.Priority;
import com.embos.entity.enums.TaskStatus;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.TaskMapper;
import com.embos.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
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
        Task task = Task.builder()
                .event(event)
                .title(request.title().trim())
                .description(request.description())
                .assignedStaff(staff)
                .dueDate(request.dueDate())
                .priority(parsePriority(request.priority()))
                .status(parseStatus(request.status()))
                .createdAt(LocalDateTime.now())
                .build();
        return taskMapper.toResponse(taskRepository.save(task));
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
        task.setStatus(parseStatus(request.status()));
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskDtos.Response updateStatus(Event event, Long taskId, String status) {
        Task task = getTask(event, taskId);
        task.setStatus(parseStatus(status));
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Event event, Long taskId) {
        Task task = getTask(event, taskId);
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
}
