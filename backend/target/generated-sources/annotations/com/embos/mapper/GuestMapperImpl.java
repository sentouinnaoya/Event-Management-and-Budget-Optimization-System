package com.embos.mapper;

import com.embos.dto.GuestDtos;
import com.embos.entity.Guest;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-02T20:17:06+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class GuestMapperImpl implements GuestMapper {

    @Override
    public GuestDtos.Response toResponse(Guest guest) {
        if ( guest == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String email = null;
        String phone = null;
        String guestType = null;
        String status = null;
        LocalDateTime createdAt = null;
        LocalDateTime updatedAt = null;

        id = guest.getId();
        name = guest.getName();
        email = guest.getEmail();
        phone = guest.getPhone();
        if ( guest.getGuestType() != null ) {
            guestType = guest.getGuestType().name();
        }
        if ( guest.getStatus() != null ) {
            status = guest.getStatus().name();
        }
        createdAt = guest.getCreatedAt();
        updatedAt = guest.getUpdatedAt();

        GuestDtos.Response response = new GuestDtos.Response( id, name, email, phone, guestType, status, createdAt, updatedAt );

        return response;
    }
}
