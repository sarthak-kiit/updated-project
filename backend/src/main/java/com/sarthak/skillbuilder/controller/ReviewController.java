package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.ReviewDTO;
import com.sarthak.skillbuilder.dto.ReviewRequestDTO;
import com.sarthak.skillbuilder.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // US15 — Submit a review for a completed session
    @PostMapping
    public ResponseEntity<ReviewDTO> submitReview(
            @RequestParam Long menteeId,
            @Valid @RequestBody ReviewRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.submitReview(menteeId, request));
    }

    // US19 — Mentor responds to a review
    @PutMapping("/{reviewId}/respond")
    public ResponseEntity<ReviewDTO> respondToReview(
            @PathVariable Long reviewId,
            @RequestParam Long mentorId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reviewService.addMentorResponse(mentorId, reviewId, body.get("response")));
    }

    // US16 / US17 — Get all reviews for a mentor
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsForMentor(@PathVariable Long mentorId) {
        return ResponseEntity.ok(reviewService.getReviewsForMentor(mentorId));
    }
}
