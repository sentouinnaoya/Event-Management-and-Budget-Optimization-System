package com.embos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_backups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    @Column(length = 150)
    private String name;

    @Column(length = 200)
    private String backupVenue;

    private LocalDate backupDate;

    private Integer backupCapacity;

    @Column(precision = 12, scale = 2)
    private BigDecimal contingencyBudget;

    @Column(columnDefinition = "TEXT")
    private String backupVendors;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime updatedAt;
}
