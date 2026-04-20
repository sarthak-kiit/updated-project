package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.MenteeDesiredSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MenteeDesiredSkillRepository extends JpaRepository<MenteeDesiredSkill, Long> {

    // US20 AC1: Top 20 requested skills (by how many mentees want them)
    // AC2: filterable by time period using profile creation/update date
    @Query("""
        SELECT mds.skillName, COUNT(mds) AS requestCount
        FROM MenteeDesiredSkill mds
        WHERE (:since IS NULL OR mds.menteeProfile.user.createdAt >= :since)
        GROUP BY mds.skillName
        ORDER BY requestCount DESC
        LIMIT 20
        """)
    List<Object[]> findTopRequestedSkills(@Param("since") LocalDateTime since);
}