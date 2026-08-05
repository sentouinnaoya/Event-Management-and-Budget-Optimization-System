package com.embos.mapper;

import com.embos.dto.AuthDtos;
import com.embos.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    AuthDtos.UserResponse toResponse(User user);
}
