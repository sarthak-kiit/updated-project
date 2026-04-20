package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.Review;
import com.sarthak.skillbuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMentorOrderByCreatedAtDesc(User mentor);
    List<Review> findByMenteeOrderByCreatedAtDesc(User mentee);
    Optional<Review> findBySessionId(Long sessionId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.mentor = :mentor")
    Double getAverageRatingForMentor(@Param("mentor") User mentor);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.mentor = :mentor")
    Long countReviewsForMentor(@Param("mentor") User mentor);
}
