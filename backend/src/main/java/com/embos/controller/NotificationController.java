package com.embos.controller;

import com.embos.dto.NotificationDtos;
import com.embos.security.AppUserDetails;
import com.embos.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDtos.Response>> list(
            @AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(notificationService.list(principal.user()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationDtos.UnreadCount> unreadCount(
            @AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(new NotificationDtos.UnreadCount(
                notificationService.unreadCount(principal.user())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id) {
        notificationService.markRead(id, principal.user());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal AppUserDetails principal) {
        notificationService.markAllRead(principal.user());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable Long id) {
        notificationService.delete(id, principal.user());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(
            @AuthenticationPrincipal AppUserDetails principal) {
        notificationService.deleteAll(principal.user());
        return ResponseEntity.noContent().build();
    }
}
