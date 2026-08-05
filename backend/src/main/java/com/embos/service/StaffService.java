package com.embos.service;

import com.embos.dto.StaffDtos;
import com.embos.entity.Event;
import com.embos.entity.Staff;
import com.embos.exception.NotFoundException;
import com.embos.mapper.StaffMapper;
import com.embos.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final StaffMapper staffMapper;

    @Transactional(readOnly = true)
    public List<StaffDtos.Response> list(Event event) {
        return staffRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .map(staffMapper::toResponse)
                .toList();
    }

    @Transactional
    public StaffDtos.Response create(Event event, StaffDtos.Request request) {
        Staff staff = Staff.builder()
                .event(event)
                .name(request.name().trim())
                .responsibility(request.responsibility().trim())
                .phone(request.phone())
                .createdAt(LocalDateTime.now())
                .build();
        return staffMapper.toResponse(staffRepository.save(staff));
    }

    @Transactional
    public StaffDtos.Response update(Event event, Long staffId, StaffDtos.Request request) {
        Staff staff = getStaff(event, staffId);
        staff.setName(request.name().trim());
        staff.setResponsibility(request.responsibility().trim());
        staff.setPhone(request.phone());
        return staffMapper.toResponse(staffRepository.save(staff));
    }

    @Transactional
    public void delete(Event event, Long staffId) {
        Staff staff = getStaff(event, staffId);
        staffRepository.delete(staff);
    }

    @Transactional(readOnly = true)
    public Staff getStaff(Event event, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Staff member not found"));
        if (!staff.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Staff member not found");
        }
        return staff;
    }
}
