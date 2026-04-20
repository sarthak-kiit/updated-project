package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.MenteeProfileDTO;
import com.sarthak.skillbuilder.service.MenteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/mentees")
@RequiredArgsConstructor
public class MenteeController {

    private final MenteeService menteeService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<MenteeProfileDTO> getMenteeProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(menteeService.getMenteeByUserId(userId));
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<MenteeProfileDTO> createOrUpdateProfile(
            @PathVariable Long userId,
            @RequestBody MenteeProfileDTO dto) {
        return ResponseEntity.ok(menteeService.createOrUpdateProfile(userId, dto));
    }
}
