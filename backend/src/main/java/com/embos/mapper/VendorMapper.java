package com.embos.mapper;

import com.embos.dto.VendorDtos;
import com.embos.entity.Vendor;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VendorMapper {

    VendorDtos.Response toResponse(Vendor vendor);
}
