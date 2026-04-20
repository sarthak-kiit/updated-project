package com.sarthak.skillbuilder.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewDTO {
    private Long id;
    private Long mentorId;
    private String menteeName;
    private Integer rating;
    private String comment;
    private String mentorResponse;
    private boolean anonymous;
    private LocalDateTime createdAt;
}