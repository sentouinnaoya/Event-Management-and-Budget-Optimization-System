package com.embos.service;

import com.embos.entity.Guest;
import com.embos.entity.enums.GuestStatus;
import com.embos.event.EventStatusChangedEvent;
import com.embos.mail.BrevoClient;
import com.embos.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventStatusEmailService {

    private static final List<GuestStatus> ACTIVE_STATUSES =
            List.of(GuestStatus.REGISTERED, GuestStatus.APPROVED, GuestStatus.ATTENDED);

    private final BrevoClient brevoClient;
    private final GuestRepository guestRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEventStatusChanged(EventStatusChangedEvent event) {
        if (!"SUSPENDED".equals(event.toStatus()) && !"FAILED".equals(event.toStatus())) {
            return;
        }
        List<Guest> guests = guestRepository.findAllByEventIdAndStatusIn(event.eventId(), ACTIVE_STATUSES);
        String statusLabel = "SUSPENDED".equals(event.toStatus()) ? "suspended" : "cancelled";
        for (Guest guest : guests) {
            if (guest.getEmail() == null || guest.getEmail().isBlank()) {
                log.info("Skipping email for guest {} — no email on file", guest.getId());
                continue;
            }
            String subject = "Update on " + event.eventName() + ": event " + statusLabel;
            brevoClient.send(guest.getEmail(), subject, buildHtml(event, guest.getName(), statusLabel));
        }
    }

    private String buildHtml(EventStatusChangedEvent event, String guestName, String statusLabel) {
        String reasonHtml = event.reason() != null && !event.reason().isBlank()
                ? """
                    <div style="border:1px solid #e2e7ef;border-radius:8px;padding:16px;margin:0 0 16px;background:#f6f7fa">
                      <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Reason from the organizer</p>
                      <p style="font-size:14px;font-weight:600;margin:0;color:#0f1b2d">%s</p>
                    </div>
                    """.formatted(escape(event.reason()))
                : "";
        String statusLine = "SUSPENDED".equals(event.toStatus())
                ? "has been temporarily suspended"
                : "has been cancelled";
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f1b2d">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#0f1b2d">Important update for <strong>%s</strong></h1>
                  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                    Hello %s,<br>
                    We're sorry to inform you that <strong>%s</strong> %s.
                    Please check your inbox again for further updates.
                  </p>
                  %s
                  <p style="font-size:13px;line-height:1.6;margin:0;color:#4c5d75">
                    If you have any questions, please contact the organizer directly.
                  </p>
                </div>
                """.formatted(escape(event.eventName()), escape(guestName),
                escape(event.eventName()), statusLine, reasonHtml);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}