package com.embos.mapper;

import com.embos.dto.EventDtos;
import com.embos.entity.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventMapper {

    @Mapping(target = "organizerName", source = "organizer.fullName")
    EventDtos.Response toResponse(Event event);
}
