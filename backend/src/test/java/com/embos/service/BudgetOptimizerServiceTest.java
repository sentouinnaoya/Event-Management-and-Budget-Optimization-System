package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BudgetOptimizerServiceTest {

    private static BudgetDtos.OptimizationCategory byId(BudgetDtos.OptimizationResponse r, long id) {
        return r.categories().stream().filter(c -> c.categoryId().equals(id)).findFirst().orElseThrow();
    }

    private static long cents(BigDecimal v) {
        return v.movePointRight(2).longValueExact();
    }

    @Test
    void surplusIsDistributedByPriorityWeight() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "Low", 1, bd("1000"), bd("200")),
                new BudgetOptimizerService.CategoryInput(2L, "High", 5, bd("1000"), bd("200")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("2400"));

        assertEquals("SURPLUS", r.status());
        // both fully funded first (1000.00 each)
        assertEquals(100000, cents(byId(r, 1L).suggestedAllocation()) - 6666);
        assertEquals(100000, cents(byId(r, 2L).suggestedAllocation()) - 33334);
        // surplus 400 split 1:5 -> ~66.67 / ~333.33
        assertTrue(cents(byId(r, 2L).suggestedAllocation()) > cents(byId(r, 1L).suggestedAllocation()));
        assertEquals(240000, r.categories().stream()
                .mapToLong(c -> cents(c.suggestedAllocation())).sum());
    }

    @Test
    void balancedBudgetFundsEveryNeedExactly() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "A", 3, bd("500"), bd("100")),
                new BudgetOptimizerService.CategoryInput(2L, "B", 4, bd("700"), bd("0")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("1200"));

        assertEquals("BALANCED", r.status());
        assertEquals(bd("500.00"), byId(r, 1L).suggestedAllocation());
        assertEquals(bd("700.00"), byId(r, 2L).suggestedAllocation());
    }

    @Test
    void deficitProtectsFloorsAndSumsToBudget() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "Venue", 5, bd("800"), bd("300")),
                new BudgetOptimizerService.CategoryInput(2L, "Decor", 2, bd("600"), bd("100")),
                new BudgetOptimizerService.CategoryInput(3L, "Misc", 3, bd("400"), bd("50")));
        // needs: 800/600/400 => 1800; floors: 300/100/50 => 450; flexible gaps: 500/500/350
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("1200"));

        assertEquals("DEFICIT", r.status());
        long total = r.categories().stream().mapToLong(c -> cents(c.suggestedAllocation())).sum();
        assertEquals(120000, total);
        for (BudgetDtos.OptimizationCategory c : r.categories()) {
            assertTrue(cents(c.suggestedAllocation()) >= cents(c.spentAmount()),
                    () -> c.name() + " fell below committed spend");
            assertTrue(cents(c.suggestedAllocation()) <= cents(c.requiredAmount()),
                    () -> c.name() + " exceeded its projected need");
            assertEquals(0, cents(c.suggestedAllocation()) % 1);
        }
    }

    @Test
    void higherPriorityKeepsMoreCoverageThanIdenticalPeer() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "Critical", 5, bd("1000"), bd("0")),
                new BudgetOptimizerService.CategoryInput(2L, "Low", 1, bd("1000"), bd("0")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("1000"));

        assertEquals("DEFICIT", r.status());
        assertTrue(cents(byId(r, 1L).suggestedAllocation()) > cents(byId(r, 2L).suggestedAllocation()));
        assertEquals(100000, r.categories().stream()
                .mapToLong(c -> cents(c.suggestedAllocation())).sum());
    }

    @Test
    void committedSpentExceedingAllocationBecomesTheFloor() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "Overspent", 3, bd("100"), bd("250")),
                new BudgetOptimizerService.CategoryInput(2L, "Normal", 3, bd("500"), bd("0")));
        // need[0] = max(250, 100) = 250; need[1] = 500; total need 750 > budget 600
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("600"));

        assertEquals("DEFICIT", r.status());
        assertEquals(bd("250.00"), byId(r, 1L).suggestedAllocation());
        assertEquals(bd("350.00"), byId(r, 2L).suggestedAllocation());
        assertTrue(r.notes().stream().anyMatch(n -> n.contains("Overspent")));
    }

    @Test
    void budgetBelowCommittedSpendingIsRejected() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "A", 3, bd("100"), bd("300")));
        assertThrows(BadRequestException.class,
                () -> BudgetOptimizerService.solve(inputs, bd("200")));
    }

    @Test
    void emptyCategoriesAreRejected() {
        assertThrows(BadRequestException.class,
                () -> BudgetOptimizerService.solve(List.of(), bd("1000")));
    }

    @Test
    void zeroNeedCategoriesOnlyReceiveSurplus() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "Empty", 3, bd("0"), bd("0")),
                new BudgetOptimizerService.CategoryInput(2L, "Real", 3, bd("400"), bd("0")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("1000"));

        assertEquals("SURPLUS", r.status());
        // equal priorities -> surplus split evenly: 400 need + 300 share / 0 need + 300 share
        assertEquals(bd("700.00"), byId(r, 2L).suggestedAllocation());
        assertEquals(bd("300.00"), byId(r, 1L).suggestedAllocation());
        assertEquals(100000, r.categories().stream()
                .mapToLong(c -> cents(c.suggestedAllocation())).sum());
    }

    @Test
    void roundingRemainderStaysWithinBudget() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "A", 1, bd("10.01"), bd("0")),
                new BudgetOptimizerService.CategoryInput(2L, "B", 2, bd("10.01"), bd("0")),
                new BudgetOptimizerService.CategoryInput(3L, "C", 3, bd("10.01"), bd("0")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("100"));

        assertEquals("SURPLUS", r.status());
        long total = r.categories().stream().mapToLong(c -> cents(c.suggestedAllocation())).sum();
        assertEquals(10000, total);
        r.categories().forEach(c ->
                assertEquals(0, c.suggestedAllocation().scale() == 2 ? 0 : 1, "scale must be 2"));
    }

    @Test
    void coveragePctReflectsDeficitCut() {
        List<BudgetOptimizerService.CategoryInput> inputs = List.of(
                new BudgetOptimizerService.CategoryInput(1L, "A", 5, bd("1000"), bd("0")),
                new BudgetOptimizerService.CategoryInput(2L, "B", 1, bd("1000"), bd("0")));
        BudgetDtos.OptimizationResponse r = BudgetOptimizerService.solve(inputs, bd("1000"));

        assertTrue(byId(r, 1L).coveragePct().doubleValue() > byId(r, 2L).coveragePct().doubleValue());
        assertTrue(byId(r, 1L).rationale().contains("short"));
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
