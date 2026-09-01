package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.entity.BudgetCategory;
import com.embos.entity.Event;
import com.embos.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Deterministic budget reallocation solver.
 *
 * Model per category:
 *   need  = max(spent, allocated)   projected requirement
 *   floor = spent                   already-committed money, never cut
 *
 * Given a total budget B:
 *   SURPLUS  (sum(need) <= B): fund every need, distribute the surplus
 *            proportionally to priority weights.
 *   DEFICIT  (sum(floor) <= B < sum(need)): protect floors, distribute the
 *            remaining budget across flexible gaps using priority-weighted
 *            water-filling (exact closed-form solution).
 *   INVALID  (B < sum(floor)): rejected - cannot cover committed spend.
 *
 * All arithmetic is done in integer cents, so results are exact.
 */
@Service
@RequiredArgsConstructor
public class BudgetOptimizerService {

    private final BudgetService budgetService;

    @Transactional(readOnly = true)
    public BudgetDtos.OptimizationResponse optimize(Event event, BigDecimal totalBudget) {
        List<BudgetDtos.CategoryResponse> categories = budgetService.listCategories(event);
        if (categories.isEmpty()) {
            throw new BadRequestException("Add budget categories before running the optimizer");
        }

        List<CategoryInput> inputs = new ArrayList<>();
        for (BudgetDtos.CategoryResponse c : categories) {
            inputs.add(new CategoryInput(c.id(), c.name(),
                    BudgetService.normalizePriority(c.priority()),
                    money(c.allocatedAmount()), money(c.spentAmount())));
        }

        BigDecimal budget = totalBudget == null
                ? inputs.stream().map(CategoryInput::allocated).reduce(BigDecimal.ZERO, BigDecimal::add)
                : money(totalBudget);

        return solve(inputs, budget);
    }

    @Transactional
    public BudgetDtos.SummaryResponse apply(Event event, List<BudgetDtos.AppliedAllocation> allocations, String actor) {
        if (allocations.isEmpty()) {
            throw new BadRequestException("No allocations to apply");
        }
        BigDecimal totalBefore = BigDecimal.ZERO;
        BigDecimal totalAfter = BigDecimal.ZERO;
        int changed = 0;
        for (BudgetDtos.AppliedAllocation a : allocations) {
            BudgetCategory category = budgetService.getCategory(event, a.categoryId());
            BigDecimal suggested = money(a.suggestedAllocation());
            if (suggested.signum() < 0) {
                throw new BadRequestException("Allocation for '" + category.getName() + "' cannot be negative");
            }
            totalBefore = totalBefore.add(category.getAllocatedAmount());
            totalAfter = totalAfter.add(suggested);
            if (category.getAllocatedAmount().compareTo(suggested) != 0) {
                changed++;
            }
            category.setAllocatedAmount(suggested);
        }
        String detail = "Optimizer applied new allocations to " + allocations.size() + " categories ("
                + changed + " changed), total " + totalBefore.toPlainString() + " -> " + totalAfter.toPlainString();
        budgetService.logOptimization(event, detail, actor);
        return budgetService.summary(event);
    }

    /**
     * Pure solver - static and side-effect free so it can be unit tested directly.
     */
    static BudgetDtos.OptimizationResponse solve(List<CategoryInput> inputs, BigDecimal budget) {
        if (inputs.isEmpty()) {
            throw new BadRequestException("No budget categories to optimize");
        }
        BigDecimal safeBudget = money(budget);
        if (safeBudget.signum() < 0) {
            throw new BadRequestException("Total budget cannot be negative");
        }

        int n = inputs.size();
        long[] need = new long[n];
        long[] floor = new long[n];
        int[] weight = new int[n];
        long sumNeed = 0;
        long sumFloor = 0;
        for (int i = 0; i < n; i++) {
            CategoryInput in = inputs.get(i);
            floor[i] = cents(in.spent());
            need[i] = Math.max(floor[i], cents(in.allocated()));
            weight[i] = Math.max(1, in.priority());
            sumNeed += need[i];
            sumFloor += floor[i];
        }
        long budgetCents = cents(safeBudget);
        if (budgetCents < sumFloor) {
            throw new BadRequestException(
                    "Total budget (" + safeBudget.toPlainString() + ") cannot cover already-committed spending ("
                            + format(sumFloor) + "). Increase the budget.");
        }

        long[] alloc = new long[n];
        String status;
        List<String> notes = new ArrayList<>();

        if (budgetCents >= sumNeed) {
            status = sumNeed == budgetCents ? "BALANCED" : "SURPLUS";
            long surplus = budgetCents - sumNeed;
            for (int i = 0; i < n; i++) {
                alloc[i] = need[i];
            }
            if (surplus > 0) {
                long weightSum = 0;
                for (int w : weight) {
                    weightSum += w;
                }
                long[] share = new long[n];
                long assigned = 0;
                for (int i = 0; i < n; i++) {
                    share[i] = surplus * weight[i] / weightSum;
                    assigned += share[i];
                }
                long leftover = surplus - assigned;
                for (int idx : orderDescByWeight(weight, n)) {
                    if (leftover-- <= 0) {
                        break;
                    }
                    share[idx]++;
                }
                for (int i = 0; i < n; i++) {
                    alloc[i] += share[i];
                }
                notes.add("Surplus of " + format(surplus) + " distributed proportionally to category priorities.");
            } else {
                notes.add("Projected requirements exactly match the available budget.");
            }
        } else {
            status = "DEFICIT";
            long flexible = budgetCents - sumFloor;
            long[] gap = new long[n];
            long totalGap = 0;
            for (int i = 0; i < n; i++) {
                gap[i] = need[i] - floor[i];
                totalGap += gap[i];
            }
            long[] funded = waterFill(gap, weight, flexible, n);
            for (int i = 0; i < n; i++) {
                alloc[i] = floor[i] + funded[i];
            }
            notes.add("Budget deficit: projected requirements (" + format(sumNeed)
                    + ") exceed the available budget (" + format(budgetCents) + ") by "
                    + format(sumNeed - budgetCents) + ".");
            notes.add("Committed spending is protected; the shortfall is spread across flexible gaps, "
                    + "with higher-priority categories keeping more coverage.");
        }

        List<BudgetDtos.OptimizationCategory> results = new ArrayList<>();
        BigDecimal totalSuggested = BigDecimal.ZERO;
        long[] gaps = gapOf(need, floor);
        for (int i = 0; i < n; i++) {
            CategoryInput in = inputs.get(i);
            long delta = alloc[i] - cents(in.allocated());
            BigDecimal coverage = need[i] == 0
                    ? BigDecimal.valueOf(100)
                    : BigDecimal.valueOf(alloc[i]).multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(need[i]), 2, RoundingMode.HALF_UP);
            results.add(new BudgetDtos.OptimizationCategory(
                    in.id(), in.name(), weight[i],
                    uncents(cents(in.allocated())), uncents(floor[i]), uncents(need[i]),
                    uncents(alloc[i]), uncents(delta), coverage,
                    rationale(in, weight[i], need[i], floor[i], gaps[i], alloc[i])));
            totalSuggested = totalSuggested.add(uncents(alloc[i]));
        }

        for (CategoryInput in : inputs) {
            long overspent = cents(in.spent()) - cents(in.allocated());
            if (overspent > 0) {
                notes.add("'" + in.name() + "' has already spent " + format(overspent)
                        + " over its current allocation.");
            }
        }

        return new BudgetDtos.OptimizationResponse(
                status, safeBudget,
                inputs.stream().map(CategoryInput::allocated).reduce(BigDecimal.ZERO, BigDecimal::add),
                uncents(sumNeed), totalSuggested, results, notes);
    }

    /**
     * Priority-weighted water-filling: choose lambda so that
     *   funded[i] = min(gap[i], lambda * weight[i])  and  sum(funded) = budget.
     * Exact integer solution via a sorted threshold scan.
     */
    private static long[] waterFill(long[] gap, int[] weight, long budget, int n) {
        long[] funded = new long[n];
        if (budget <= 0) {
            return funded;
        }
        Integer[] byRatio = new Integer[n];
        for (int i = 0; i < n; i++) {
            byRatio[i] = i;
        }
        // sort by gap/weight ascending using cross-multiplication (exact)
        java.util.Arrays.sort(byRatio, (a, b) -> Long.compare(gap[a] * weight[b], gap[b] * weight[a]));

        long prefixGap = 0;
        long suffixWeight = 0;
        for (int i = 0; i < n; i++) {
            suffixWeight += weight[i];
        }
        Double lambda = null;
        for (int k = 0; k <= n; k++) {
            if (k == n) {
                // everything capped would mean budget >= sum(gap); cannot happen here,
                // but fall back to lambda above the largest threshold
                lambda = Double.MAX_VALUE;
                break;
            }
            int idx = byRatio[k];
            if (suffixWeight == 0) {
                break;
            }
            double candidate = (double) (budget - prefixGap) / suffixWeight;
            double prevThreshold = k == 0 ? Double.NEGATIVE_INFINITY
                    : (double) gap[byRatio[k - 1]] / weight[byRatio[k - 1]];
            double nextThreshold = (double) gap[idx] / weight[idx];
            if (candidate >= prevThreshold && candidate <= nextThreshold) {
                lambda = candidate;
                break;
            }
            prefixGap += gap[idx];
            suffixWeight -= weight[idx];
        }
        if (lambda == null) {
            lambda = Double.MAX_VALUE;
        }

        long assigned = 0;
        for (int i = 0; i < n; i++) {
            funded[i] = Math.min(gap[i], (long) (lambda * weight[i]));
            assigned += funded[i];
        }
        // distribute rounding leftovers cent by cent, highest priority first
        long leftover = budget - assigned;
        Integer[] order = orderDescByWeight(weight, n);
        boolean progressed = true;
        while (leftover > 0 && progressed) {
            progressed = false;
            for (int idx : order) {
                if (leftover <= 0) {
                    break;
                }
                if (funded[idx] < gap[idx]) {
                    funded[idx]++;
                    leftover--;
                    progressed = true;
                }
            }
        }
        return funded;
    }

    private static Integer[] orderDescByWeight(int[] weight, int n) {
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) {
            order[i] = i;
        }
        java.util.Arrays.sort(order, (a, b) -> {
            int c = Integer.compare(weight[b], weight[a]);
            return c != 0 ? c : Integer.compare(a, b);
        });
        return order;
    }

    private static long[] gapOf(long[] need, long[] floor) {
        long[] gap = new long[need.length];
        for (int i = 0; i < need.length; i++) {
            gap[i] = need[i] - floor[i];
        }
        return gap;
    }

    private static String rationale(CategoryInput in, int weight, long need, long floor, long gap, long alloc) {
        StringBuilder sb = new StringBuilder();
        if (need == 0) {
            sb.append("No recorded spending or prior allocation");
            if (alloc > 0) {
                sb.append("; receives ").append(format(alloc)).append(" from the surplus");
            }
            return sb.toString();
        }
        if (alloc >= need) {
            sb.append("Projected need ").append(format(need)).append(" fully covered");
            long extra = alloc - need;
            if (extra > 0) {
                sb.append(" plus ").append(format(extra)).append(" surplus share (priority ").append(weight).append("/5)");
            }
        } else {
            long shortfall = need - alloc;
            sb.append("Deficit cut: covers ").append(format(alloc)).append(" of ").append(format(need))
                    .append(" (").append(shortfall).append(" short)")
                    .append("; committed spend of ").append(format(floor)).append(" protected")
                    .append(" (priority ").append(weight).append("/5)");
        }
        long delta = alloc - cents(in.allocated());
        if (delta != 0) {
            sb.append(delta > 0 ? "; +" : "; -").append(format(Math.abs(delta)))
                    .append(" vs current allocation");
        }
        return sb.toString();
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static long cents(BigDecimal value) {
        return money(value).movePointRight(2).longValueExact();
    }

    private static BigDecimal uncents(long centsValue) {
        return BigDecimal.valueOf(centsValue, 2);
    }

    private static String format(long centsValue) {
        return uncents(centsValue).toPlainString();
    }

    record CategoryInput(Long id, String name, int priority, BigDecimal allocated, BigDecimal spent) {
    }
}
