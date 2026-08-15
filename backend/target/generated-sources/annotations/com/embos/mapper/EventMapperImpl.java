package com.embos.mapper;

import com.embos.dto.EventDtos;
import com.embos.entity.Event;
import com.embos.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-15T15:14:47+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class EventMapperImpl implements EventMapper {

    @Override
    public EventDtos.Response toResponse(Event event) {
        if ( event == null ) {
            return null;
        }

        String organizerName = null;
        Long id = null;
        String name = null;
        String description = null;
        LocalDate date = null;
        Integer durationInDays = null;
        String venue = null;
        Integer capacity = null;
        LocalDate registrationDeadline = null;
        String status = null;
        String registrationToken = null;
        LocalDateTime createdAt = null;
        LocalDateTime updatedAt = null;

        organizerName = eventOrganizerFullName( event );
        id = event.getId();
        name = event.getName();
        description = event.getDescription();
        date = event.getDate();
        durationInDays = event.getDurationInDays();
        venue = event.getVenue();
        capacity = event.getCapacity();
        registrationDeadline = event.getRegistrationDeadline();
        if ( event.getStatus() != null ) {
            status = event.getStatus().name();
        }
        registrationToken = event.getRegistrationToken();
        createdAt = event.getCreatedAt();
        updatedAt = event.getUpdatedAt();

        EventDtos.Response response = new EventDtos.Response( id, name, description, date, durationInDays, venue, capacity, registrationDeadline, status, registrationToken, organizerName, createdAt, updatedAt );

        return response;
    }

    private String eventOrganizerFullName(Event event) {
        User organizer = event.getOrganizer();
        if ( organizer == null ) {
            return null;
        }
        return organizer.getFullName();
    }
}
