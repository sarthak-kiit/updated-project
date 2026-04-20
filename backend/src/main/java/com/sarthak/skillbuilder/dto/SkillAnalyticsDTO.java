package com.sarthak.skillbuilder.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillAnalyticsDTO {

    private String skillName;
    private Long requestCount;   // how many mentee profiles desire this skill
    private Long sessionCount;   // how many COMPLETED sessions had this skill tagged
    private Long mentorCount;    // how many mentors offer this skill
}