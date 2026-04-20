package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.SessionNote;
import com.sarthak.skillbuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionNoteRepository extends JpaRepository<SessionNote, Long> {

    // US23: all notes for a mentee — chronological (most recent first)
    List<SessionNote> findByMenteeOrderBySessionScheduledAtDesc(User mentee);

    // Check if note already exists for this session + mentee
    Optional<SessionNote> findBySessionIdAndMenteeId(Long sessionId, Long menteeId);

    // US23: all unique skill tags used by this mentee across all sessions
    @Query("SELECT sn.skillsTags FROM SessionNote sn WHERE sn.mentee.id = :menteeId AND sn.skillsTags IS NOT NULL")
    List<String> findAllSkillsTagsByMenteeId(@Param("menteeId") Long menteeId);

    // US20: all skill tag CSV strings across ALL mentees (for admin analytics)
    @Query("SELECT sn.skillsTags FROM SessionNote sn WHERE sn.skillsTags IS NOT NULL")
    List<String> findAllSkillTagStrings();
}