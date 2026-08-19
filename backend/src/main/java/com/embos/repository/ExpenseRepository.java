package com.embos.repository;

import com.embos.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByEventIdOrderByExpenseDateDesc(Long eventId);

    List<Expense> findAllByEventId(Long eventId);

    List<Expense> findAllByCategoryId(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByVendorId(Long vendorId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal sumAmountAll();

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.paymentStatus = 'PENDING'")
    long countPending();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.event.organizer.id = :userId")
    BigDecimal sumAmountByOrganizerId(Long userId);
}
