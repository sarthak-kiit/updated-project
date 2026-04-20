package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.MentorProfileDTO;
import com.sarthak.skillbuilder.service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @GetMapping
    public ResponseEntity<List<MentorProfileDTO>> getAllMentors() {
        return ResponseEntity.ok(mentorService.getAllMentors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MentorProfileDTO> getMentorById(@PathVariable Long id) {
        return ResponseEntity.ok(mentorService.getMentorById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<MentorProfileDTO> getMentorByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(mentorService.getMentorByUserId(userId));
    }

    @GetMapping("/search/skill")
    public ResponseEntity<List<MentorProfileDTO>> searchBySkill(@RequestParam String skill) {
        return ResponseEntity.ok(mentorService.searchBySkill(skill));
    }

    @GetMapping("/search/industry")
    public ResponseEntity<List<MentorProfileDTO>> searchByIndustry(@RequestParam String industry) {
        return ResponseEntity.ok(mentorService.searchByIndustry(industry));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<MentorProfileDTO>> getTopRated() {
        return ResponseEntity.ok(mentorService.getTopRated());
    }

    // US09: recommendations based on mentee's industry and skill matches
    @GetMapping("/recommended/{menteeUserId}")
    public ResponseEntity<List<MentorProfileDTO>> getRecommended(@PathVariable Long menteeUserId) {
        return ResponseEntity.ok(mentorService.getRecommendedForMentee(menteeUserId));
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<MentorProfileDTO> updateProfile(
            @PathVariable Long userId,
            @RequestBody MentorProfileDTO dto) {
        return ResponseEntity.ok(mentorService.createOrUpdateProfile(userId, dto));
    }
}
