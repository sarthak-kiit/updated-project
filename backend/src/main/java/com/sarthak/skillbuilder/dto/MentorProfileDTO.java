package com.sarthak.skillbuilder.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MentorProfileDTO {

    // From mentor_profiles table
    private Long id;
    private String headline;
    private String company;
    private String designation;
    private Integer yearsOfExperience;
    private String education;           // US01 SRS: education field — ADD THIS LINE
    private String professionalSummary;
    private Double averageRating;
    private Integer totalSessions;
    private Integer totalReviews;

    // From users table
    private Long userId;
    private String fullName;
    private String email;
    private String profileImageUrl;

    // From mentor_industries table
    private List<String> industries;

    // From mentor_skills table
    private List<SkillDTO> skills;

    // From work_experiences table
    private List<WorkExperienceDTO> workExperiences;

    // From availabilities table
    private List<AvailabilityDTO> availabilities;
}