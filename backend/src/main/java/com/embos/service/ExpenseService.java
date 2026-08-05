package com.embos.service;

import com.embos.dto.ExpenseDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Event;
import com.embos.entity.Expense;
import com.embos.entity.Vendor;
import com.embos.entity.enums.PaymentStatus;
import com.embos.exception.BadRequestException;
import com.embos.exception.NotFoundException;
import com.embos.mapper.ExpenseMapper;
import com.embos.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<ExpenseDtos.Response> list(Event event) {
        return expenseRepository.findAllByEventIdOrderByExpenseDateDesc(event.getId()).stream()
                .map(expenseMapper::toResponse)
                .toList();
    }

    @Transactional
    public ExpenseDtos.Response create(Event event, ExpenseDtos.Request request) {
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
        return expenseMapper.toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseDtos.Response update(Event event, Long expenseId, ExpenseDtos.Request request) {
        Expense expense = getExpense(event, expenseId);
        expense.setCategory(budgetService.getCategory(event, request.categoryId()));
        expense.setVendor(request.vendorId() == null
                ? null
                : vendorService.getVendor(event, request.vendorId()));
        expense.setDescription(request.description().trim());
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setPaymentStatus(parseStatus(request.paymentStatus()));
        return expenseMapper.toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Event event, Long expenseId) {
        Expense expense = getExpense(event, expenseId);
        expenseRepository.delete(expense);
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
