package com.embos.mapper;

import com.embos.dto.TaskDtos;
import com.embos.entity.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "assignedStaffId", source = "assignedStaff.id")
    @Mapping(target = "assignedStaffName", source = "assignedStaff.name")
    TaskDtos.Response toResponse(Task task);
}
