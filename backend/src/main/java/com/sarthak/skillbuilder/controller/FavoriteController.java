package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.MentorProfileDTO;
import com.sarthak.skillbuilder.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    // US08 — Add mentor to favourites
    @PostMapping
    public ResponseEntity<Map<String, String>> addFavorite(
            @RequestParam Long menteeId,
            @RequestParam Long mentorId) {
        favoriteService.addFavorite(menteeId, mentorId);
        return ResponseEntity.ok(Map.of("message", "Mentor added to favourites"));
    }

    // US08 — Remove mentor from favourites
    @DeleteMapping
    public ResponseEntity<Map<String, String>> removeFavorite(
            @RequestParam Long menteeId,
            @RequestParam Long mentorId) {
        favoriteService.removeFavorite(menteeId, mentorId);
        return ResponseEntity.ok(Map.of("message", "Mentor removed from favourites"));
    }

    // US08 — Get all favourited mentors for a mentee
    @GetMapping("/mentee/{menteeId}")
    public ResponseEntity<List<MentorProfileDTO>> getFavorites(@PathVariable Long menteeId) {
        return ResponseEntity.ok(favoriteService.getFavoritesForMentee(menteeId));
    }
}
