package com.sarthak.skillbuilder.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkExperienceDTO {
    private Long id;
    private String companyName;
    private String jobTitle;
    private String startDate;
    private String endDate;
    private boolean currentJob;
    private String description;
}