package com.embos.repository;

import com.embos.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByEventIdOrderByExpenseDateDesc(Long eventId);

    List<Expense> findAllByEventId(Long eventId);

    List<Expense> findAllByCategoryId(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByVendorId(Long vendorId);
}
