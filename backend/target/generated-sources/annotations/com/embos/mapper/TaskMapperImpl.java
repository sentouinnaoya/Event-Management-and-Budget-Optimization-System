package com.embos.mapper;

import com.embos.dto.TaskDtos;
import com.embos.entity.Staff;
import com.embos.entity.Task;
import java.time.LocalDate;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-17T22:33:29+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class TaskMapperImpl implements TaskMapper {

    @Override
    public TaskDtos.Response toResponse(Task task) {
        if ( task == null ) {
            return null;
        }

        Long assignedStaffId = null;
        String assignedStaffName = null;
        Long id = null;
        String title = null;
        String description = null;
        LocalDate dueDate = null;
        String priority = null;
        String status = null;
        LocalDateTime completedAt = null;

        assignedStaffId = taskAssignedStaffId( task );
        assignedStaffName = taskAssignedStaffName( task );
        id = task.getId();
        title = task.getTitle();
        description = task.getDescription();
        dueDate = task.getDueDate();
        if ( task.getPriority() != null ) {
            priority = task.getPriority().name();
        }
        if ( task.getStatus() != null ) {
            status = task.getStatus().name();
        }
        completedAt = task.getCompletedAt();

        TaskDtos.Response response = new TaskDtos.Response( id, title, description, assignedStaffId, assignedStaffName, dueDate, priority, status, completedAt );

        return response;
    }

    private Long taskAssignedStaffId(Task task) {
        Staff assignedStaff = task.getAssignedStaff();
        if ( assignedStaff == null ) {
            return null;
        }
        return assignedStaff.getId();
    }

    private String taskAssignedStaffName(Task task) {
        Staff assignedStaff = task.getAssignedStaff();
        if ( assignedStaff == null ) {
            return null;
        }
        return assignedStaff.getName();
    }
}
