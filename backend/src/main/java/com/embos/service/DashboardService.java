package com.embos.service;

import com.embos.dto.BudgetDtos;
import com.embos.dto.DashboardDtos;
import com.embos.dto.EventDtos;
import com.embos.entity.Event;
import com.embos.entity.User;
import com.embos.entity.enums.EventStatus;
import com.embos.mapper.EventMapper;
import com.embos.repository.EventRepository;
import com.embos.repository.GuestRepository;
import com.embos.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;
    private final BudgetService budgetService;
    private final EventMapper eventMapper;

    @Transactional(readOnly = true)
    public DashboardDtos.Response dashboard(User currentUser) {
        List<Event> events = SecurityUtils.isAdmin()
                ? eventRepository.findAllByOrderByCreatedAtDesc()
                : eventRepository.findAllByOrganizerIdOrderByCreatedAtDesc(currentUser.getId());

        long totalGuests = 0;
        BigDecimal totalAllocated = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;
        int draft = 0, published = 0, ongoing = 0, completed = 0, archived = 0;

        for (Event event : events) {
            switch (event.getStatus()) {
                case DRAFT -> draft++;
                case PUBLISHED -> published++;
                case ONGOING -> ongoing++;
                case COMPLETED -> completed++;
                case ARCHIVED -> archived++;
            }
            if (event.getStatus() != EventStatus.ARCHIVED) {
                totalGuests += guestRepository.countByEventId(event.getId());
                BudgetDtos.SummaryResponse summary = budgetService.summary(event);
                totalAllocated = totalAllocated.add(summary.totalAllocated());
                totalSpent = totalSpent.add(summary.totalSpent());
            }
        }

        List<EventDtos.Response> recentEvents = events.stream()
                .filter(e -> e.getStatus() != EventStatus.ARCHIVED)
                .limit(5)
                .map(eventMapper::toResponse)
                .toList();

        return new DashboardDtos.Response(
                events.size(), draft, published, ongoing, completed, archived,
                totalGuests, totalAllocated, totalSpent, recentEvents);
    }
}
