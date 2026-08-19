package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.dto.ExpenseDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Event;
import com.embos.entity.Expense;
import com.embos.entity.Vendor;
import com.embos.entity.enums.PaymentStatus;
import com.embos.event.BudgetExceededEvent;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.ExpenseMapper;
import com.embos.repository.ExpenseRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BudgetService budgetService;
    private final VendorService vendorService;
    private final ExpenseMapper expenseMapper;
    private final EventLogService eventLogService;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectProvider<AiAdvisorService> aiAdvisorProvider;

    @Transactional(readOnly = true)
    public List<ExpenseDtos.Response> list(Event event) {
        return expenseRepository.findAllByEventIdOrderByExpenseDateDesc(event.getId()).stream()
                .map(expenseMapper::toResponse)
                .toList();
    }

    @Transactional
    public ExpenseDtos.Response create(Event event, ExpenseDtos.Request request, String actor) {
        BudgetCategory category = budgetService.getCategory(event, request.categoryId());
        Vendor vendor = request.vendorId() == null
                ? null
                : vendorService.getVendor(event, request.vendorId());
        Expense expense = Expense.builder()
                .event(event)
                .category(category)
                .vendor(vendor)
                .description(request.description().trim())
                .amount(request.amount())
                .expenseDate(request.expenseDate())
                .paymentStatus(parseStatus(request.paymentStatus()))
                .createdAt(LocalDateTime.now())
                .build();
        Expense saved = expenseRepository.saveAndFlush(expense);
        eventLogService.log(event, "EXPENSE_CREATED",
                "Added expense '" + saved.getDescription() + "' of " + saved.getAmount().toPlainString()
                        + (saved.getVendor() != null ? " to " + saved.getVendor().getName() : "")
                        + " under '" + saved.getCategory().getName() + "'", actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "EXPENSE_CREATED", "Expense", saved.getId(), saved.getDescription(),
                "Created expense of " + saved.getAmount().toPlainString());
        publishBudgetExceeded(event, saved.getCategory());
        AiAdvisorService.scheduleAfterCommit(aiAdvisorProvider, event);
        return expenseMapper.toResponse(saved);
    }

    @Transactional
    public ExpenseDtos.Response update(Event event, Long expenseId, ExpenseDtos.Request request, String actor) {
        Expense expense = getExpense(event, expenseId);
        expense.setCategory(budgetService.getCategory(event, request.categoryId()));
        expense.setVendor(request.vendorId() == null
                ? null
                : vendorService.getVendor(event, request.vendorId()));
        expense.setDescription(request.description().trim());
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setPaymentStatus(parseStatus(request.paymentStatus()));
        Expense saved = expenseRepository.saveAndFlush(expense);
        eventLogService.log(event, "EXPENSE_UPDATED",
                "Updated expense '" + saved.getDescription() + "' to " + saved.getAmount().toPlainString()
                        + " under '" + saved.getCategory().getName() + "'", actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "EXPENSE_UPDATED", "Expense", saved.getId(), saved.getDescription(),
                "Updated expense to " + saved.getAmount().toPlainString());
        publishBudgetExceeded(event, saved.getCategory());
        AiAdvisorService.scheduleAfterCommit(aiAdvisorProvider, event);
        return expenseMapper.toResponse(saved);
    }

    private void publishBudgetExceeded(Event event, BudgetCategory category) {
        BudgetDtos.SummaryResponse summary = budgetService.summary(event);
        BigDecimal categorySpent = summary.categories().stream()
                .filter(c -> c.id().equals(category.getId()))
                .map(BudgetDtos.CategoryResponse::spentAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO);
        BigDecimal categoryOvershoot = categorySpent.subtract(category.getAllocatedAmount());
        BigDecimal eventOvershoot = summary.totalSpent().subtract(summary.totalAllocated());
        if (categoryOvershoot.compareTo(BigDecimal.ZERO) > 0 || eventOvershoot.compareTo(BigDecimal.ZERO) > 0) {
            eventPublisher.publishEvent(new BudgetExceededEvent(
                    event.getId(), event.getOrganizer().getId(), event.getName(), category.getName(),
                    categoryOvershoot.compareTo(BigDecimal.ZERO) > 0 ? categoryOvershoot : null,
                    eventOvershoot.compareTo(BigDecimal.ZERO) > 0 ? eventOvershoot : null));
        }
    }

    @Transactional
    public void delete(Event event, Long expenseId, String actor) {
        Expense expense = getExpense(event, expenseId);
        eventLogService.log(event, "EXPENSE_DELETED",
                "Deleted expense '" + expense.getDescription() + "' of " + expense.getAmount().toPlainString()
                        + " under '" + expense.getCategory().getName() + "'", actor);
        var u = SecurityUtils.currentUser();
        auditLogService.log(u.getId(), u.getFullName(), u.getRole().name(),
                "EXPENSE_DELETED", "Expense", expense.getId(), expense.getDescription(),
                "Deleted expense of " + expense.getAmount().toPlainString());
        expenseRepository.delete(expense);
        AiAdvisorService.scheduleAfterCommit(aiAdvisorProvider, event);
    }

    @Transactional(readOnly = true)
    public Expense getExpense(Event event, Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new NotFoundException("Expense not found"));
        if (!expense.getEvent().getId().equals(event.getId())) {
            throw new NotFoundException("Expense not found");
        }
        return expense;
    }

    @Transactional(readOnly = true)
    public BigDecimal totalSpent(Event event) {
        return expenseRepository.findAllByEventId(event.getId()).stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PaymentStatus parseStatus(String status) {
        try {
            return PaymentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment status: " + status);
        }
    }
}
