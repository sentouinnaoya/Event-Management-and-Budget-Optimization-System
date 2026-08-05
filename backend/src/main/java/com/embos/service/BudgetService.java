package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Event;
import com.embos.entity.Expense;
import com.embos.exception.BadRequestException;
import com.embos.exception.ConflictException;
import com.embos.exception.NotFoundException;
import com.embos.repository.BudgetCategoryRepository;
import com.embos.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final BudgetCategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public List<BudgetDtos.CategoryResponse> listCategories(Event event) {
        return categoryRepository.findAllByEventIdOrderByCreatedAtAsc(event.getId()).stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Transactional
    public BudgetDtos.CategoryResponse addCategory(Event event, BudgetDtos.CategoryRequest request) {
        if (categoryRepository.existsByEventIdAndName(event.getId(), request.name().trim())) {
            throw new ConflictException("A budget category with this name already exists");
        }
        BudgetCategory category = BudgetCategory.builder()
                .event(event)
                .name(request.name().trim())
                .allocatedAmount(request.allocatedAmount())
                .alertThresholdPct(request.alertThresholdPct())
                .createdAt(LocalDateTime.now())
                .build();
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public BudgetDtos.CategoryResponse updateCategory(Event event, Long categoryId, BudgetDtos.CategoryRequest request) {
        BudgetCategory category = getCategory(event, categoryId);
        category.setName(request.name().trim());
        category.setAllocatedAmount(request.allocatedAmount());
        category.setAlertThresholdPct(request.alertThresholdPct());
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Event event, Long categoryId) {
        BudgetCategory category = getCategory(event, categoryId);
        if (expenseRepository.existsByCategoryId(categoryId)) {
            throw new BadRequestException("Cannot delete a category that already has expenses");
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public BudgetCategory getCategory(Event event, Long categoryId) {
        BudgetCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Budget category not found"));
        if (!category.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Budget category not found");
        }
        return category;
    }

    @Transactional(readOnly = true)
    public BudgetDtos.SummaryResponse summary(Event event) {
        List<BudgetDtos.CategoryResponse> categories = listCategories(event);
        BigDecimal totalAllocated = categories.stream()
                .map(BudgetDtos.CategoryResponse::allocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSpent = categories.stream()
                .map(BudgetDtos.CategoryResponse::spentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRemaining = totalAllocated.subtract(totalSpent);

        List<String> recommendations = new ArrayList<>();
        for (BudgetDtos.CategoryResponse category : categories) {
            if ("EXCEEDED".equals(category.alertLevel())) {
                recommendations.add(String.format(
                        "Category '%s' exceeded its allocation by %s. Reduce scope or reallocate budget.",
                        category.name(), category.remainingAmount().negate()));
            } else if ("WARNING".equals(category.alertLevel())) {
                recommendations.add(String.format(
                        "Category '%s' is at %s%% of its allocation. Consider pausing spending.",
                        category.name(), category.utilizationPct()));
            }
        }
        if (totalAllocated.signum() > 0) {
            BigDecimal usage = totalSpent.multiply(HUNDRED).divide(totalAllocated, 2, RoundingMode.HALF_UP);
            recommendations.add(String.format(
                    "Overall budget usage is %s%% of %s. Remaining: %s",
                    usage, totalAllocated, totalRemaining));
        }
        if (totalSpent.signum() == 0) {
            recommendations.add("No expenses recorded yet. Start tracking expenses to monitor your budget.");
        }

        return new BudgetDtos.SummaryResponse(totalAllocated, totalSpent, totalRemaining, categories, recommendations);
    }

    private BudgetDtos.CategoryResponse toCategoryResponse(BudgetCategory category) {
        BigDecimal spent = expenseRepository.findAllByCategoryId(category.getId()).stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal allocated = category.getAllocatedAmount();
        BigDecimal remaining = allocated.subtract(spent);
        BigDecimal utilization = allocated.signum() == 0
                ? BigDecimal.ZERO
                : spent.multiply(HUNDRED).divide(allocated, 2, RoundingMode.HALF_UP);
        String alertLevel = utilization.compareTo(HUNDRED) >= 0
                ? "EXCEEDED"
                : utilization.compareTo(category.getAlertThresholdPct()) >= 0
                ? "WARNING"
                : "OK";
        return new BudgetDtos.CategoryResponse(
                category.getId(), category.getName(), allocated, category.getAlertThresholdPct(),
                spent, remaining, utilization, alertLevel);
    }
}
