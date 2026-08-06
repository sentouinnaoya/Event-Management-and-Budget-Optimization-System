package com.embos.mapper;

import com.embos.dto.StaffDtos;
import com.embos.entity.Staff;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-05T20:59:18+0630",
    comments = "version: 1.6.2, compiler: Eclipse JDT (IDE) 3.46.100.v20260624-0231, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class StaffMapperImpl implements StaffMapper {

    @Override
    public StaffDtos.Response toResponse(Staff staff) {
        if ( staff == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String responsibility = null;
        String phone = null;

        id = staff.getId();
        name = staff.getName();
        responsibility = staff.getResponsibility();
        phone = staff.getPhone();

        StaffDtos.Response response = new StaffDtos.Response( id, name, responsibility, phone );

        return response;
    }
}
