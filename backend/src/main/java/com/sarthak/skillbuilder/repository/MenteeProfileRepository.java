package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.MenteeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MenteeProfileRepository extends JpaRepository<MenteeProfile, Long> {
    Optional<MenteeProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}