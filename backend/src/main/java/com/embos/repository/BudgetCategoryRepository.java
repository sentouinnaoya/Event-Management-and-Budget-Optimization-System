package com.embos.repository;

import com.embos.entity.BudgetCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, Long> {

    List<BudgetCategory> findAllByEventIdOrderByCreatedAtAsc(Long eventId);

    boolean existsByEventIdAndName(Long eventId, String name);
}
