package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.*;
import com.sarthak.skillbuilder.entity.*;
import com.sarthak.skillbuilder.exception.*;
import com.sarthak.skillbuilder.repository.*;
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
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;

    @Transactional
    public ReviewDTO submitReview(Long menteeId, ReviewRequestDTO request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        if (!session.getMentee().getId().equals(menteeId))
            throw new UnauthorizedException("You can only review your own sessions");
        if (session.getStatus() != Session.SessionStatus.COMPLETED)
            throw new BadRequestException("Can only review completed sessions");
        if (reviewRepository.findBySessionId(request.getSessionId()).isPresent())
            throw new DuplicateResourceException("Review already submitted for this session");

        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", menteeId));

        Review review = Review.builder()
                .session(session).mentee(mentee).mentor(session.getMentor())
                .rating(request.getRating()).comment(request.getComment())
                .anonymous(request.isAnonymous()).build();

        reviewRepository.save(review);
        updateMentorRating(session.getMentor());
        return toDTO(review);
    }

    @Transactional
    public ReviewDTO addMentorResponse(Long mentorId, Long reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getMentor().getId().equals(mentorId))
            throw new UnauthorizedException("Not authorized to respond to this review");

        LocalDateTime cutoff = review.getCreatedAt().plusHours(48);
        if (LocalDateTime.now().isAfter(cutoff))
            throw new BadRequestException("Response window of 48 hours has expired");

        review.setMentorResponse(response);
        review.setUpdatedAt(LocalDateTime.now());
        return toDTO(reviewRepository.save(review));
    }

    public List<ReviewDTO> getReviewsForMentor(Long mentorId) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", mentorId));
        return reviewRepository.findByMentorOrderByCreatedAtDesc(mentor)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void updateMentorRating(User mentor) {
        Double avg = reviewRepository.getAverageRatingForMentor(mentor);
        Long count = reviewRepository.countReviewsForMentor(mentor);
        mentorProfileRepository.findByUserId(mentor.getId()).ifPresent(mp -> {
            mp.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            mp.setTotalReviews(count.intValue());
            mentorProfileRepository.save(mp);
        });
    }

    private ReviewDTO toDTO(Review r) {
        String menteeName = r.isAnonymous() ? "Anonymous" : r.getMentee().getFullName();
        return ReviewDTO.builder()
                .id(r.getId()).mentorId(r.getMentor().getId())
                .menteeName(menteeName).rating(r.getRating())
                .comment(r.getComment()).mentorResponse(r.getMentorResponse())
                .anonymous(r.isAnonymous()).createdAt(r.getCreatedAt()).build();
    }
}
