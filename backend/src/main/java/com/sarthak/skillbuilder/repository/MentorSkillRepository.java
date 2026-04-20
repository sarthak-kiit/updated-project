package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.MentorSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorSkillRepository extends JpaRepository<MentorSkill, Long> {

    // US20: how many mentors supply each skill (for mentor-supply column in analytics)
    @Query("""
        SELECT ms.skillName, COUNT(DISTINCT ms.mentorProfile) AS mentorCount
        FROM MentorSkill ms
        GROUP BY ms.skillName
        ORDER BY mentorCount DESC
        """)
    List<Object[]> findSkillSupplyCount();
}