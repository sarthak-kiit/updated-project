package com.sarthak.skillbuilder.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MenteeProfileDTO {

    // From mentee_profiles table
    private Long id;
    private String careerObjectives;

    // From users table
    private Long userId;
    private String fullName;
    private String email;

    // From mentee_interests table
    private List<String> interests;

    // From mentee_desired_skills table
    private List<String> desiredSkills;

    // From mentee_career_goals table
    private List<String> careerGoals;
}