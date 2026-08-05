package com.embos.mapper;

import com.embos.dto.StaffDtos;
import com.embos.entity.Staff;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface StaffMapper {

    StaffDtos.Response toResponse(Staff staff);
}
