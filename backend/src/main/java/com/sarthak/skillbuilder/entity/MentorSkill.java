package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    private String skillName;
    private String category;

    @Enumerated(EnumType.STRING)
    private ExpertiseLevel expertiseLevel;

    public enum ExpertiseLevel {
        BEGINNER, INTERMEDIATE, EXPERT
    }
}