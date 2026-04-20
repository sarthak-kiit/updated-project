package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentee_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenteeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // US02: career objectives
    @Column(columnDefinition = "TEXT")
    private String careerObjectives;

    // US02: industry interests → mentee_interests table
    @OneToMany(mappedBy = "menteeProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenteeInterest> interests = new ArrayList<>();

    // US02: desired skills → mentee_desired_skills table
    @OneToMany(mappedBy = "menteeProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenteeDesiredSkill> desiredSkills = new ArrayList<>();

    // US02: career goals → mentee_career_goals table
    @OneToMany(mappedBy = "menteeProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenteeCareerGoal> careerGoals = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}