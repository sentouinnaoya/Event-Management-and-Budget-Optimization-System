package com.embos.mapper;

import com.embos.dto.ExpenseDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Expense;
import com.embos.entity.Vendor;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-02T20:17:05+0630",
    comments = "version: 1.6.2, compiler: javac, environment: Java 19.0.1 (Oracle Corporation)"
)
@Component
public class ExpenseMapperImpl implements ExpenseMapper {

    @Override
    public ExpenseDtos.Response toResponse(Expense expense) {
        if ( expense == null ) {
            return null;
        }

        Long categoryId = null;
        String categoryName = null;
        Long vendorId = null;
        String vendorName = null;
        Long id = null;
        String description = null;
        BigDecimal amount = null;
        LocalDate expenseDate = null;
        String paymentStatus = null;

        categoryId = expenseCategoryId( expense );
        categoryName = expenseCategoryName( expense );
        vendorId = expenseVendorId( expense );
        vendorName = expenseVendorName( expense );
        id = expense.getId();
        description = expense.getDescription();
        amount = expense.getAmount();
        expenseDate = expense.getExpenseDate();
        if ( expense.getPaymentStatus() != null ) {
            paymentStatus = expense.getPaymentStatus().name();
        }

        ExpenseDtos.Response response = new ExpenseDtos.Response( id, description, categoryId, categoryName, vendorId, vendorName, amount, expenseDate, paymentStatus );

        return response;
    }

    private Long expenseCategoryId(Expense expense) {
        BudgetCategory category = expense.getCategory();
        if ( category == null ) {
            return null;
        }
        return category.getId();
    }

    private String expenseCategoryName(Expense expense) {
        BudgetCategory category = expense.getCategory();
        if ( category == null ) {
            return null;
        }
        return category.getName();
    }

    private Long expenseVendorId(Expense expense) {
        Vendor vendor = expense.getVendor();
        if ( vendor == null ) {
            return null;
        }
        return vendor.getId();
    }

    private String expenseVendorName(Expense expense) {
        Vendor vendor = expense.getVendor();
        if ( vendor == null ) {
            return null;
        }
        return vendor.getName();
    }
}
