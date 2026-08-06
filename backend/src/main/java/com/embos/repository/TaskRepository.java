package com.embos.repository;

import com.embos.entity.Task;
import com.embos.entity.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByEventIdOrderByDueDateAsc(Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, TaskStatus status);

    long countByEventIdAndCreatedAtBetween(Long eventId, LocalDateTime start, LocalDateTime end);

    long countByEventIdAndDueDate(Long eventId, LocalDate dueDate);

    long countByEventIdAndStatusAndCompletedAtBetween(Long eventId, TaskStatus status, LocalDateTime start, LocalDateTime end);
}
