package com.embos.service;

import com.embos.entity.Event;
import com.embos.entity.Guest;
import com.embos.entity.enums.GuestStatus;
import com.embos.event.RecoveryPointRestoredEvent;
import com.embos.mail.BrevoClient;
import com.embos.repository.EventRepository;
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
public class EventRestoredEmailService {

    private final BrevoClient brevoClient;
    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRecoveryPointRestored(RecoveryPointRestoredEvent event) {
        Event newEvent = eventRepository.findById(event.restoredEventId()).orElse(null);
        if (newEvent == null) {
            log.warn("Restored event {} not found; skipping new-event emails", event.restoredEventId());
            return;
        }
        List<Guest> guests = guestRepository.findAllByEventIdOrderByCreatedAtAsc(newEvent.getId());
        for (Guest guest : guests) {
            if (guest.getEmail() == null || guest.getEmail().isBlank()) {
                log.info("Skipping email for guest {} — no email on file", guest.getId());
                continue;
            }
            sendNewEventNotice(newEvent, guest);
        }
    }

    private void sendNewEventNotice(Event newEvent, Guest guest) {
        String subject = "Update: new event created — " + newEvent.getName();
        brevoClient.send(guest.getEmail(), subject, buildHtml(newEvent, guest));
    }

    private String buildHtml(Event newEvent, Guest guest) {
        String date = newEvent.getDate() == null ? "" : newEvent.getDate().toString();
        String venue = escape(newEvent.getVenue());
        String statusNote;
        if (guest.getStatus() == GuestStatus.APPROVED) {
            String code = guest.getRegistrationCode() == null ? "" : guest.getRegistrationCode();
            statusNote = """
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
                    """.formatted(escape(guest.getName()), escape(newEvent.getName()), date,
                    venue, escape(code));
        } else if (guest.getStatus() == GuestStatus.REJECTED) {
            statusNote = """
                    <div style="border:1px solid #f9d7d7;border-radius:8px;padding:16px;margin:0 0 16px;background:#fff6f6">
                      <p style="font-size:14px;line-height:1.6;margin:0;color:#7a1f1f">
                        Your earlier registration was not approved, and this has not changed for the new event.
                        If you believe this is a mistake, please contact the organizer directly.
                      </p>
                    </div>
                    """;
        } else {
            statusNote = """
                    <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                      Your registration details have been carried over to the new event.
                    </p>
                    """;
        }
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f1b2d">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#0f1b2d">Update: new event created</h1>
                  <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                    Hello %s,<br>
                    A new event <strong>%s</strong> was created from the previous one.
                    Your account with EMBOS has been updated accordingly.
                  </p>
                  <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">New event</p>
                  <p style="font-size:14px;font-weight:600;margin:0 0 4px">%s</p>
                  <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Date</p>
                  <p style="font-size:14px;font-weight:600;margin:0 0 4px">%s</p>
                  <p style="font-size:12px;margin:0 0 4px;color:#4c5d75">Venue</p>
                  <p style="font-size:14px;font-weight:600;margin:0 0 16px">%s</p>
                  %s
                  <p style="font-size:13px;line-height:1.6;margin:0;color:#4c5d75">
                    If you have any questions, please contact the organizer directly.
                  </p>
                </div>
                """.formatted(escape(guest.getName()), escape(newEvent.getName()),
                escape(newEvent.getName()), date, venue, statusNote);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}