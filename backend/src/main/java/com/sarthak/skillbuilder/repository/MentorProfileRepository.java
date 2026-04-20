package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.MentorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long> {

    Optional<MentorProfile> findByUserId(Long userId);

    @Query("SELECT mp FROM MentorProfile mp JOIN mp.skills s WHERE s.skillName LIKE %:skill%")
    List<MentorProfile> findBySkill(@Param("skill") String skill);

    @Query("SELECT mp FROM MentorProfile mp JOIN mp.industries i WHERE i.industry = :industry")
    List<MentorProfile> findByIndustry(@Param("industry") String industry);

    // Only return mentors who have at least one skill OR one industry — excludes empty/incomplete profiles
    @Query("SELECT DISTINCT mp FROM MentorProfile mp " +
           "WHERE (SIZE(mp.skills) > 0 OR SIZE(mp.industries) > 0) " +
           "ORDER BY mp.averageRating DESC")
    List<MentorProfile> findTopRated();

    @Query("""
        SELECT DISTINCT mp
        FROM MentorProfile mp
        WHERE
            (SIZE(mp.skills) > 0 OR SIZE(mp.industries) > 0)
            AND
            (
                EXISTS (
                    SELECT mi FROM MentorIndustry mi
                    WHERE mi.mentorProfile = mp
                    AND mi.industry IN (
                        SELECT mti.industryInterest FROM MenteeInterest mti
                        WHERE mti.menteeProfile.user.id = :menteeUserId
                    )
                )
                OR
                EXISTS (
                    SELECT ms FROM MentorSkill ms
                    WHERE ms.mentorProfile = mp
                    AND ms.skillName IN (
                        SELECT mds.skillName FROM MenteeDesiredSkill mds
                        WHERE mds.menteeProfile.user.id = :menteeUserId
                    )
                )
            )
        ORDER BY mp.averageRating DESC
        """)
    List<MentorProfile> findRecommendedForMentee(@Param("menteeUserId") Long menteeUserId);
}