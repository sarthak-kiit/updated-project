package com.sarthak.skillbuilder.service;
 
import com.sarthak.skillbuilder.dto.SessionDTO;
import com.sarthak.skillbuilder.dto.SessionRequestDTO;
import com.sarthak.skillbuilder.entity.Session;
import com.sarthak.skillbuilder.entity.User;
import com.sarthak.skillbuilder.exception.BadRequestException;
import com.sarthak.skillbuilder.exception.ResourceNotFoundException;
import com.sarthak.skillbuilder.repository.MentorProfileRepository;
import com.sarthak.skillbuilder.repository.SessionRepository;
import com.sarthak.skillbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SessionService {
 
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;       // US14 — injected via @RequiredArgsConstructor
    private final MentorProfileRepository mentorProfileRepository; // US15 — update totalSessions on complete
 
    // US10 — Book session
    @Transactional
    public SessionDTO bookSession(Long menteeId, SessionRequestDTO dto) {
 
        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));
 
        User mentor = userRepository.findById(dto.getMentorId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getMentorId()));
 
        if (mentor.getRole() != User.Role.MENTOR)
            throw new BadRequestException("Selected user is not a mentor");
 
        if (mentee.getRole() != User.Role.MENTEE)
            throw new BadRequestException("Only mentees can book sessions");
 
        if (dto.getScheduledAt() == null)
            throw new BadRequestException("Please provide a scheduled date and time");
 
        if (dto.getScheduledAt().isBefore(LocalDateTime.now()))
            throw new BadRequestException("Session must be scheduled in the future");
 
        Session session = Session.builder()
                .mentor(mentor)
                .mentee(mentee)
                .scheduledAt(dto.getScheduledAt())
                .durationMinutes(dto.getDurationMinutes() != null
                    ? dto.getDurationMinutes() : 60)
                .agenda(dto.getAgenda())
                .status(Session.SessionStatus.PENDING)
                .build();
 
        Session saved = sessionRepository.save(session);
        log.info("Session booked: mentee {} with mentor {}", menteeId, dto.getMentorId());
        return toDTO(saved);
    }
 
    // Get all sessions for a user
    public List<SessionDTO> getSessionsForUser(Long userId) {
        return sessionRepository.findAllForUser(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
 
    // Get session by ID
    public SessionDTO getSessionById(Long sessionId) {
        return toDTO(getSession(sessionId));
    }
 
    // US11 — Confirm
    // US14 SRS: "email notification sent within 1 minute of confirmation
    //            containing date, time, participant name, and meeting link"
    @Transactional
    public SessionDTO confirmSession(Long sessionId) {
        Session session = getSession(sessionId);
        if (session.getStatus() != Session.SessionStatus.PENDING)
            throw new BadRequestException("Only pending sessions can be confirmed");
        session.setStatus(Session.SessionStatus.CONFIRMED);
        session.setUpdatedAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);
 
        // US14 — send confirmation email to both mentor and mentee (async, non-blocking)
        emailService.sendSessionConfirmation(saved);
 
        return toDTO(saved);
    }
 
    // US11 — Reject
    @Transactional
    public SessionDTO rejectSession(Long sessionId, String reason) {
        Session session = getSession(sessionId);
        if (session.getStatus() != Session.SessionStatus.PENDING)
            throw new BadRequestException("Only pending sessions can be rejected");
        session.setStatus(Session.SessionStatus.REJECTED);
        session.setRejectionReason(reason);
        session.setUpdatedAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);
 
        // US14 — notify mentee of rejection (async, non-blocking)
        emailService.sendSessionRejection(saved);
 
        return toDTO(saved);
    }
 
    // US12 — Reschedule
    @Transactional
    public SessionDTO rescheduleSession(Long sessionId, SessionRequestDTO dto) {
        Session session = getSession(sessionId);
        if (session.getScheduledAt().minusHours(24).isBefore(LocalDateTime.now()))
            throw new BadRequestException(
                "Sessions can only be rescheduled at least 24 hours before");
        session.setScheduledAt(dto.getScheduledAt());
        if (dto.getDurationMinutes() != null)
            session.setDurationMinutes(dto.getDurationMinutes());
        session.setStatus(Session.SessionStatus.RESCHEDULED);
        session.setUpdatedAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);
 
        // US14 — notify both parties of new schedule (async, non-blocking)
        emailService.sendSessionRescheduled(saved);
 
        return toDTO(saved);
    }
 
    // US13 — Cancel
    @Transactional
    public SessionDTO cancelSession(Long sessionId) {
        Session session = getSession(sessionId);
        if (session.getScheduledAt().minusHours(24).isBefore(LocalDateTime.now()))
            throw new BadRequestException(
                "Sessions can only be cancelled at least 24 hours before");
        session.setStatus(Session.SessionStatus.CANCELLED);
        session.setUpdatedAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);
 
        // US14 — notify both parties of cancellation (async, non-blocking)
        emailService.sendSessionCancellation(saved);
 
        return toDTO(saved);
    }
 
    // US15 — Mark session as completed (called by MENTOR after session ends)
    // This triggers the review prompt on the mentee's side
    @Transactional
    public SessionDTO completeSession(Long sessionId, Long mentorId) {
        Session session = getSession(sessionId);
 
        // Only the mentor of this session can mark it complete
        if (!session.getMentor().getId().equals(mentorId))
            throw new BadRequestException("Only the mentor of this session can mark it as completed");
 
        // Only CONFIRMED sessions can be marked complete
        if (session.getStatus() != Session.SessionStatus.CONFIRMED)
            throw new BadRequestException("Only confirmed sessions can be marked as completed");
 
        session.setStatus(Session.SessionStatus.COMPLETED);
        session.setUpdatedAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);
 
        // Update mentor's total session count on their profile
        mentorProfileRepository.findByUserId(mentorId).ifPresent(mp -> {
            mp.setTotalSessions(mp.getTotalSessions() + 1);
            mentorProfileRepository.save(mp);
        });
 
        log.info("US15 — Session #{} marked COMPLETED by mentorId:{}", sessionId, mentorId);
        return toDTO(saved);
    }
 
    // ── Helper ──────────────────────────────────────────────────
    private Session getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session", "id", sessionId));
    }
 
    private SessionDTO toDTO(Session s) {
        return SessionDTO.builder()
                .id(s.getId())
                .mentorId(s.getMentor().getId())
                .mentorName(s.getMentor().getFullName())
                .menteeId(s.getMentee().getId())
                .menteeName(s.getMentee().getFullName())
                .scheduledAt(s.getScheduledAt())
                .durationMinutes(s.getDurationMinutes())
                .agenda(s.getAgenda())
                .status(s.getStatus().name())
                .rejectionReason(s.getRejectionReason())
                .createdAt(s.getCreatedAt())
                .build();
    }
}