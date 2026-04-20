package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.SessionNoteDTO;
import com.sarthak.skillbuilder.dto.SessionNoteRequestDTO;
import com.sarthak.skillbuilder.entity.Session;
import com.sarthak.skillbuilder.entity.SessionNote;
import com.sarthak.skillbuilder.entity.User;
import com.sarthak.skillbuilder.exception.BadRequestException;
import com.sarthak.skillbuilder.exception.ResourceNotFoundException;
import com.sarthak.skillbuilder.exception.UnauthorizedException;
import com.sarthak.skillbuilder.repository.MenteeProfileRepository;
import com.sarthak.skillbuilder.repository.SessionNoteRepository;
import com.sarthak.skillbuilder.repository.SessionRepository;
import com.sarthak.skillbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SessionNoteService {

    private final SessionNoteRepository sessionNoteRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MenteeProfileRepository menteeProfileRepository;

    // US23: save or update note + skill tags for a completed session
    @Transactional
    public SessionNoteDTO saveNote(Long menteeId, SessionNoteRequestDTO request) {

        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));

        if (mentee.getRole() != User.Role.MENTEE)
            throw new BadRequestException("Only mentees can add session notes");

        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        // Only the mentee of this session can add notes
        if (!session.getMentee().getId().equals(menteeId))
            throw new UnauthorizedException("You can only add notes to your own sessions");

        // Only COMPLETED sessions can have notes
        if (session.getStatus() != Session.SessionStatus.COMPLETED)
            throw new BadRequestException("Notes can only be added to completed sessions");

        // Create or update — one note per session per mentee
        SessionNote note = sessionNoteRepository
                .findBySessionIdAndMenteeId(request.getSessionId(), menteeId)
                .orElse(SessionNote.builder().session(session).mentee(mentee).build());

        note.setNotes(request.getNotes());

        // Store skills as comma-separated string
        if (request.getSkillsTags() != null && !request.getSkillsTags().isEmpty()) {
            String tags = request.getSkillsTags().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(String::trim)
                    .distinct()
                    .collect(Collectors.joining(","));
            note.setSkillsTags(tags);
        } else {
            note.setSkillsTags(null);
        }

        SessionNote saved = sessionNoteRepository.save(note);
        log.info("US23 — Note saved for sessionId:{} by menteeId:{}", request.getSessionId(), menteeId);
        return toDTO(saved);
    }

    // US23: get all session notes for a mentee (progress timeline)
    public List<SessionNoteDTO> getProgressForMentee(Long menteeId) {
        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));
        return sessionNoteRepository.findByMenteeOrderBySessionScheduledAtDesc(mentee)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // US23: get note for a specific session (for pre-filling the edit form)
    public Optional<SessionNoteDTO> getNoteForSession(Long sessionId, Long menteeId) {
        return sessionNoteRepository.findBySessionIdAndMenteeId(sessionId, menteeId)
                .map(this::toDTO);
    }

    // US23: next-skill suggestions — skills in mentee's desired list not yet tagged in any session
    public List<String> getNextSkillSuggestions(Long menteeId) {

        // Get all skills the mentee wants to learn (from their profile)
        List<String> desiredSkills = menteeProfileRepository.findByUserId(menteeId)
                .map(p -> p.getDesiredSkills().stream()
                        .map(ds -> ds.getSkillName())
                        .collect(Collectors.toList()))
                .orElse(Collections.emptyList());

        // Get all skills already tagged across completed sessions
        List<String> taggedSkills = sessionNoteRepository
                .findAllSkillsTagsByMenteeId(menteeId)
                .stream()
                .flatMap(csv -> Arrays.stream(csv.split(",")))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());

        // Suggest: desired skills not yet covered in any session
        List<String> suggestions = desiredSkills.stream()
                .filter(skill -> taggedSkills.stream()
                        .noneMatch(tagged -> tagged.equalsIgnoreCase(skill)))
                .collect(Collectors.toList());

        log.info("US23 — {} next-skill suggestions for menteeId:{}", suggestions.size(), menteeId);
        return suggestions;
    }

    private SessionNoteDTO toDTO(SessionNote n) {
        List<String> tags = (n.getSkillsTags() != null && !n.getSkillsTags().isBlank())
                ? Arrays.asList(n.getSkillsTags().split(","))
                : Collections.emptyList();

        return SessionNoteDTO.builder()
                .id(n.getId())
                .sessionId(n.getSession().getId())
                .mentorName(n.getSession().getMentor().getFullName())
                .sessionDate(n.getSession().getScheduledAt())
                .durationMinutes(n.getSession().getDurationMinutes())
                .agenda(n.getSession().getAgenda())
                .notes(n.getNotes())
                .skillsTags(tags)
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}