package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"user", "industries", "skills", "workExperiences", "availabilities"})
public class MentorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // US01: professional info
    private String headline;
    private String company;
    private String designation;
    private Integer yearsOfExperience;

    // US01 SRS: "Profile form includes fields for work experience, education,
    //            skills, and industry specializations"
    private String education;

    // US01: bio/description field
    @Column(columnDefinition = "TEXT")
    private String professionalSummary;

    // US01: industry specializations → mentor_industries table
    @OneToMany(mappedBy = "mentorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MentorIndustry> industries = new ArrayList<>();

    // US01: skills → mentor_skills table
    @OneToMany(mappedBy = "mentorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MentorSkill> skills = new ArrayList<>();

    // US01: work experiences → work_experiences table
    @OneToMany(mappedBy = "mentorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkExperience> workExperiences = new ArrayList<>();

    // US03: availability → availabilities table
    @OneToMany(mappedBy = "mentorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Availability> availabilities = new ArrayList<>();

    // System calculated
    @Column(nullable = false)
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalSessions = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalReviews = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}