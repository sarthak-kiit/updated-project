package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.SessionDTO;
import com.sarthak.skillbuilder.dto.SessionRequestDTO;
import com.sarthak.skillbuilder.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // US10 — Book session
    @PostMapping("/book/{menteeId}")
    public ResponseEntity<SessionDTO> bookSession(
            @PathVariable Long menteeId,
            @RequestBody SessionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.bookSession(menteeId, request));
    }

    // US11 — Confirm session
    @PutMapping("/{sessionId}/confirm")
    public ResponseEntity<SessionDTO> confirmSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.confirmSession(sessionId));
    }

    // US11 — Reject session
    @PutMapping("/{sessionId}/reject")
    public ResponseEntity<SessionDTO> rejectSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        return ResponseEntity.ok(sessionService.rejectSession(sessionId, reason));
    }

    // US12 — Reschedule session
    @PutMapping("/{sessionId}/reschedule")
    public ResponseEntity<SessionDTO> rescheduleSession(
            @PathVariable Long sessionId,
            @RequestBody SessionRequestDTO request) {
        return ResponseEntity.ok(sessionService.rescheduleSession(sessionId, request));
    }

    // US13 — Cancel session
    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<SessionDTO> cancelSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.cancelSession(sessionId));
    }

    // US15 — Mark session as completed (mentor only)
    @PutMapping("/{sessionId}/complete")
    public ResponseEntity<SessionDTO> completeSession(
            @PathVariable Long sessionId,
            @RequestParam Long mentorId) {
        return ResponseEntity.ok(sessionService.completeSession(sessionId, mentorId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SessionDTO>> getSessionsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(sessionService.getSessionsForUser(userId));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionDTO> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.getSessionById(sessionId));
    }
}
