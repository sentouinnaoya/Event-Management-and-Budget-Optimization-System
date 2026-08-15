package com.embos.service;

import com.embos.event.GuestStatusChangedEvent;
import com.embos.mail.ResendClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuestEmailService {

    private final ResendClient resendClient;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGuestStatusChanged(GuestStatusChangedEvent event) {
        if (event.guestEmail() == null || event.guestEmail().isBlank()) {
            log.info("Skipping email for guest {} — no email on file", event.guestId());
            return;
        }
        if ("APPROVED".equals(event.newStatus())) {
            sendApproved(event);
        } else if ("REJECTED".equals(event.newStatus())) {
            sendRejected(event);
        }
    }

    private void sendApproved(GuestStatusChangedEvent event) {
        String code = event.registrationCode() == null ? "" : event.registrationCode();
        String eventDate = event.eventDate() == null ? "" : event.eventDate().toString();
        String venue = escape(event.eventVenue());
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f1b2d">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#0f1b2d">You're confirmed for %s</h1>
                  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                    Great news — your registration for <strong>%s</strong> has been approved.
                    Here is your ticket:
                  </p>
                  <div style="border:1px solid #e2e7ef;border-radius:8px;padding:16px;margin:0 0 16px;background:#f6f7fa">
                    <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Guest</p>
                    <p style="font-size:14px;font-weight:600;margin:0 0 12px">%s</p>
                    <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Event</p>
                    <p style="font-size:14px;font-weight:600;margin:0 0 12px">%s</p>
                    <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Date</p>
                    <p style="font-size:14px;font-weight:600;margin:0 0 12px">%s</p>
                    <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Venue</p>
                    <p style="font-size:14px;font-weight:600;margin:0 0 12px">%s</p>
                    <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Ticket number</p>
                    <p style="font-size:18px;font-weight:bold;margin:0;letter-spacing:2px;font-family:monospace">%s</p>
                  </div>
                  <p style="font-size:13px;line-height:1.6;margin:0;color:#4c5d75">
                    Show this ticket at check-in on the day of the event.
                  </p>
                </div>
                """.formatted(escape(event.eventName()), escape(event.eventName()),
                escape(event.guestName()), escape(event.eventName()), eventDate,
                venue, escape(code));
        resendClient.send(event.guestEmail(), "You're confirmed for " + event.eventName() + " — here's your ticket", html);
    }

    private void sendRejected(GuestStatusChangedEvent event) {
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f1b2d">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#0f1b2d">Update on your registration</h1>
                  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                    Thank you for registering for <strong>%s</strong>.
                  </p>
                  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                    We're sorry, but your registration was not approved for this event.
                    If you believe this is a mistake, please contact the organizer directly.
                  </p>
                </div>
                """.formatted(escape(event.eventName()));
        resendClient.send(event.guestEmail(),
                "Update on your registration for " + event.eventName(), html);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
