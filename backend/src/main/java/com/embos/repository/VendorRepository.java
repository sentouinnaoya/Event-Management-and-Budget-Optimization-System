package com.embos.repository;

import com.embos.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findAllByEventIdOrderByCreatedAtAsc(Long eventId);
}
