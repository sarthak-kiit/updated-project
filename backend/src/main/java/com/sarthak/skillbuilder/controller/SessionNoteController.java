package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.SessionNoteDTO;
import com.sarthak.skillbuilder.dto.SessionNoteRequestDTO;
import com.sarthak.skillbuilder.service.SessionNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * US23 — Mentee progress tracking via session notes and skill tags.
 */
@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class SessionNoteController {

    private final SessionNoteService sessionNoteService;

    // US23: Save or update note + skill tags for a completed session
    @PostMapping("/notes/{menteeId}")
    public ResponseEntity<SessionNoteDTO> saveNote(
            @PathVariable Long menteeId,
            @Valid @RequestBody SessionNoteRequestDTO request) {
        return ResponseEntity.ok(sessionNoteService.saveNote(menteeId, request));
    }

    // US23: Get full progress timeline for a mentee (all notes chronologically)
    @GetMapping("/{menteeId}")
    public ResponseEntity<List<SessionNoteDTO>> getProgress(@PathVariable Long menteeId) {
        return ResponseEntity.ok(sessionNoteService.getProgressForMentee(menteeId));
    }

    // US23: Get note for a specific session (for pre-filling edit form)
    @GetMapping("/notes/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getNoteForSession(
            @PathVariable Long sessionId,
            @RequestParam Long menteeId) {
        return sessionNoteService.getNoteForSession(sessionId, menteeId)
                .map(note -> ResponseEntity.ok(Map.of("found", true, "note", (Object) note)))
                .orElse(ResponseEntity.ok(Map.of("found", false)));
    }

    // US23: Next-skill suggestions — desired skills not yet covered in sessions
    @GetMapping("/suggestions/{menteeId}")
    public ResponseEntity<List<String>> getNextSkillSuggestions(@PathVariable Long menteeId) {
        return ResponseEntity.ok(sessionNoteService.getNextSkillSuggestions(menteeId));
    }
}
