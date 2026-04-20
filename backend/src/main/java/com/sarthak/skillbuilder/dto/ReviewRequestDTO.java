package com.sarthak.skillbuilder.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewRequestDTO {
    @NotNull private Long sessionId;
    @NotNull @Min(1) @Max(5) private Integer rating;
    private String comment;
    private boolean anonymous;
}