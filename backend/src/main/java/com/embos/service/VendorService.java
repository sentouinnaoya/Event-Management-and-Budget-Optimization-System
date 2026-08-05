package com.embos.service;

import com.embos.dto.VendorDtos;
import com.embos.entity.Event;
import com.embos.entity.Vendor;
import com.embos.entity.enums.VendorStatus;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.VendorMapper;
import com.embos.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorMapper vendorMapper;

    @Transactional(readOnly = true)
    public List<VendorDtos.Response> list(Event event) {
        return vendorRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .map(vendorMapper::toResponse)
                .toList();
    }

    @Transactional
    public VendorDtos.Response create(Event event, VendorDtos.Request request) {
        Vendor vendor = Vendor.builder()
                .event(event)
                .name(request.name().trim())
                .serviceType(request.serviceType().trim())
                .contactPerson(request.contactPerson())
                .email(request.email())
                .phone(request.phone())
                .assignedAmount(request.assignedAmount())
                .status(parseStatus(request.status()))
                .createdAt(LocalDateTime.now())
                .build();
        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorDtos.Response update(Event event, Long vendorId, VendorDtos.Request request) {
        Vendor vendor = getVendor(event, vendorId);
        vendor.setName(request.name().trim());
        vendor.setServiceType(request.serviceType().trim());
        vendor.setContactPerson(request.contactPerson());
        vendor.setEmail(request.email());
        vendor.setPhone(request.phone());
        vendor.setAssignedAmount(request.assignedAmount());
        vendor.setStatus(parseStatus(request.status()));
        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public void delete(Event event, Long vendorId) {
        Vendor vendor = getVendor(event, vendorId);
        vendorRepository.delete(vendor);
    }

    @Transactional(readOnly = true)
    public Vendor getVendor(Event event, Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new NotFoundException("Vendor not found"));
        if (!vendor.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Vendor not found");
        }
        return vendor;
    }

    private VendorStatus parseStatus(String status) {
        try {
            return VendorStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid vendor status: " + status);
        }
    }
}
