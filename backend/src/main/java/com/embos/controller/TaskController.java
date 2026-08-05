package com.embos.controller;

import com.embos.dto.TaskDtos;
import com.embos.entity.Event;
import com.embos.security.AppUserDetails;
import com.embos.service.EventService;
import com.embos.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final EventService eventService;
    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(taskService.list(event));
    }

    @PostMapping
    public ResponseEntity<TaskDtos.Response> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @Valid @RequestBody TaskDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(event, request));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskDtos.Response> update(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDtos.Request request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(taskService.update(event, taskId, request));
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskDtos.Response> updateStatus(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDtos.StatusRequest request) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        return ResponseEntity.ok(taskService.updateStatus(event, taskId, request.status()));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long eventId,
            @PathVariable Long taskId) {
        Event event = eventService.getOwnedEvent(eventId, principal.user());
        taskService.delete(event, taskId);
        return ResponseEntity.noContent().build();
    }
}
