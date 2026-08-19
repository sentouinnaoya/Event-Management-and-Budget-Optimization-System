package com.embos.mapper;

import com.embos.dto.VendorDtos;
import com.embos.entity.Vendor;
import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-17T22:33:29+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class VendorMapperImpl implements VendorMapper {

    @Override
    public VendorDtos.Response toResponse(Vendor vendor) {
        if ( vendor == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String serviceType = null;
        String contactPerson = null;
        String email = null;
        String phone = null;
        BigDecimal assignedAmount = null;
        String status = null;

        id = vendor.getId();
        name = vendor.getName();
        serviceType = vendor.getServiceType();
        contactPerson = vendor.getContactPerson();
        email = vendor.getEmail();
        phone = vendor.getPhone();
        assignedAmount = vendor.getAssignedAmount();
        if ( vendor.getStatus() != null ) {
            status = vendor.getStatus().name();
        }

        VendorDtos.Response response = new VendorDtos.Response( id, name, serviceType, contactPerson, email, phone, assignedAmount, status );

        return response;
    }
}
