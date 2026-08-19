package com.embos.repository;

import com.embos.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findAllByEventIdOrderByCreatedAtAsc(Long eventId);

    long countByEventId(Long eventId);

    long countByEventIdAndCreatedAtBetween(Long eventId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(v) FROM Vendor v")
    long countAll();
}
