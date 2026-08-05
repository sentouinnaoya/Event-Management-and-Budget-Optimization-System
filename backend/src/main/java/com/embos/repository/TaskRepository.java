package com.embos.repository;

import com.embos.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByEventIdOrderByDueDateAsc(Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndStatus(Long eventId, com.embos.entity.enums.TaskStatus status);
}
