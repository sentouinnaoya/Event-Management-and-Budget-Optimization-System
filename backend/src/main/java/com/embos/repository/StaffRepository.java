package com.embos.repository;

import com.embos.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    List<Staff> findAllByEventIdOrderByCreatedAtAsc(Long eventId);

    long countByEventId(Long eventId);
}
