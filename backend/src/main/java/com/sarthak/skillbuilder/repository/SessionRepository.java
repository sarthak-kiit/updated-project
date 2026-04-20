package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.Session;
import com.sarthak.skillbuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findByMentorOrderByScheduledAtDesc(User mentor);

    List<Session> findByMenteeOrderByScheduledAtDesc(User mentee);

    @Query("SELECT s FROM Session s WHERE s.mentor.id = :userId " +
           "OR s.mentee.id = :userId ORDER BY s.scheduledAt DESC")
    List<Session> findAllForUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.mentor = :mentor " +
           "AND s.status = 'COMPLETED'")
    Long countCompletedByMentor(@Param("mentor") User mentor);
}