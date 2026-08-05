package com.embos.mapper;

import com.embos.dto.AuthDtos;
import com.embos.entity.User;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-02T20:17:05+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public AuthDtos.UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        Long id = null;
        String fullName = null;
        String email = null;
        String role = null;
        LocalDateTime createdAt = null;

        id = user.getId();
        fullName = user.getFullName();
        email = user.getEmail();
        if ( user.getRole() != null ) {
            role = user.getRole().name();
        }
        createdAt = user.getCreatedAt();

        AuthDtos.UserResponse userResponse = new AuthDtos.UserResponse( id, fullName, email, role, createdAt );

        return userResponse;
    }
}
