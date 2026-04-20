package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.entity.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * US14 — Email notifications for session events.
 * SRS: "System sends email notification within 1 minute of confirmation
 *       containing date, time, participant name, and meeting link."
 *
 * Uses SimpleMailMessage (plain text) — simpler than MimeMessage.
 * All methods are @Async so they never block the HTTP response thread.
 * If mail sending fails, the error is only logged — the session action still succeeds.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy");
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("hh:mm a");

    // ── US14: Session Confirmed ──────────────────────────────────────────────
    // SRS: "email notification within 1 minute of confirmation"
    // SRS: "date, time, participant name, and meeting link"
    @Async
    public void sendSessionConfirmation(Session session) {
        String date     = session.getScheduledAt().format(DATE_FMT);
        String time     = session.getScheduledAt().format(TIME_FMT);
        String duration = session.getDurationMinutes() + " minutes";
        String agenda   = session.getAgenda() != null
                            ? session.getAgenda() : "No agenda provided";
        String link     = session.getMeetingLink() != null
                            ? session.getMeetingLink()
                            : "A meeting link will be shared before the session.";

        String mentorName = session.getMentor().getFullName();
        String menteeName = session.getMentee().getFullName();

        // ── Email to mentee ──
        String menteeBody =
            "Hi " + menteeName + ",\n\n"
            + "Your session has been confirmed!\n\n"
            + "Session Details:\n"
            + "────────────────────────────────\n"
            + "Date     : " + date     + "\n"
            + "Time     : " + time     + "\n"
            + "Duration : " + duration + "\n"
            + "Mentor   : " + mentorName + "\n"
            + "Agenda   : " + agenda   + "\n"
            + "Link     : " + link     + "\n"
            + "────────────────────────────────\n\n"
            + "Please be ready 5 minutes before the session.\n"
            + "If you need to cancel, please do so at least 24 hours in advance.\n\n"
            + "Best regards,\n"
            + "SkillBuilder — Infosys Mentoring Platform";

        sendSimple(
            session.getMentee().getEmail(),
            "Session Confirmed — SkillBuilder",
            menteeBody
        );

        // ── Email to mentor ──
        String mentorBody =
            "Hi " + mentorName + ",\n\n"
            + "You have confirmed a session!\n\n"
            + "Session Details:\n"
            + "────────────────────────────────\n"
            + "Date     : " + date     + "\n"
            + "Time     : " + time     + "\n"
            + "Duration : " + duration + "\n"
            + "Mentee   : " + menteeName + "\n"
            + "Agenda   : " + agenda   + "\n"
            + "Link     : " + link     + "\n"
            + "────────────────────────────────\n\n"
            + "Best regards,\n"
            + "SkillBuilder — Infosys Mentoring Platform";

        sendSimple(
            session.getMentor().getEmail(),
            "Session Confirmed — SkillBuilder",
            mentorBody
        );

        log.info("US14 — Confirmation emails sent for session #{}", session.getId());
    }

    // ── US14: Session Rejected ───────────────────────────────────────────────
    @Async
    public void sendSessionRejection(Session session) {
        String reason = session.getRejectionReason() != null
                        ? session.getRejectionReason() : "No reason provided";

        String body =
            "Hi " + session.getMentee().getFullName() + ",\n\n"
            + "Unfortunately, " + session.getMentor().getFullName()
            + " was unable to accept your session request.\n\n"
            + "Session Details:\n"
            + "────────────────────────────────\n"
            + "Date   : " + session.getScheduledAt().format(DATE_FMT) + "\n"
            + "Time   : " + session.getScheduledAt().format(TIME_FMT) + "\n"
            + "Reason : " + reason + "\n"
            + "────────────────────────────────\n\n"
            + "You can browse other available mentors and book a new session.\n\n"
            + "Best regards,\n"
            + "SkillBuilder — Infosys Mentoring Platform";

        sendSimple(
            session.getMentee().getEmail(),
            "Session Request Declined — SkillBuilder",
            body
        );

        log.info("US14 — Rejection email sent for session #{}", session.getId());
    }

    // ── US14: Session Cancelled ──────────────────────────────────────────────
    @Async
    public void sendSessionCancellation(Session session) {
        String body =
            "Hi,\n\n"
            + "The session between "
            + session.getMentor().getFullName() + " and "
            + session.getMentee().getFullName() + " has been cancelled.\n\n"
            + "Session Details:\n"
            + "────────────────────────────────\n"
            + "Date : " + session.getScheduledAt().format(DATE_FMT) + "\n"
            + "Time : " + session.getScheduledAt().format(TIME_FMT) + "\n"
            + "────────────────────────────────\n\n"
            + "You can book a new session at any time from the SkillBuilder platform.\n\n"
            + "Best regards,\n"
            + "SkillBuilder — Infosys Mentoring Platform";

        sendSimple(session.getMentee().getEmail(), "Session Cancelled — SkillBuilder", body);
        sendSimple(session.getMentor().getEmail(), "Session Cancelled — SkillBuilder", body);

        log.info("US14 — Cancellation emails sent for session #{}", session.getId());
    }

    // ── US14: Session Rescheduled ────────────────────────────────────────────
    @Async
    public void sendSessionRescheduled(Session session) {
        String body =
            "Hi,\n\n"
            + "The session between "
            + session.getMentor().getFullName() + " and "
            + session.getMentee().getFullName() + " has been rescheduled.\n\n"
            + "New Schedule:\n"
            + "────────────────────────────────\n"
            + "Date     : " + session.getScheduledAt().format(DATE_FMT) + "\n"
            + "Time     : " + session.getScheduledAt().format(TIME_FMT) + "\n"
            + "Duration : " + session.getDurationMinutes() + " minutes\n"
            + "────────────────────────────────\n\n"
            + "Best regards,\n"
            + "SkillBuilder — Infosys Mentoring Platform";

        sendSimple(session.getMentee().getEmail(), "Session Rescheduled — SkillBuilder", body);
        sendSimple(session.getMentor().getEmail(), "Session Rescheduled — SkillBuilder", body);

        log.info("US14 — Reschedule emails sent for session #{}", session.getId());
    }

    // ── Core send helper — SimpleMailMessage ────────────────────────────────
    private void sendSimple(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@skillbuilder.com");
            mailSender.send(message);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MailException e) {
            // Log error but do NOT throw — email failure must never break session flow
            log.error("Failed to send email to {} — {}", to, e.getMessage());
        }
    }
}