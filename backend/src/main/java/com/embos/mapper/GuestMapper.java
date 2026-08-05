package com.embos.mapper;

import com.embos.dto.GuestDtos;
import com.embos.entity.Guest;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GuestMapper {

    GuestDtos.Response toResponse(Guest guest);
}
