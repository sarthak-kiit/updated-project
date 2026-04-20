package com.sarthak.skillbuilder.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SkillDTO {
    private Long id;
    private String skillName;
    private String category;
    private String expertiseLevel;
}