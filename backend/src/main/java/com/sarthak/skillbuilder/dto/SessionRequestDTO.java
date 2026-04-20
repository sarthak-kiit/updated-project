package com.sarthak.skillbuilder.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionRequestDTO {
    @NotNull private Long mentorId;
    @NotNull private LocalDateTime scheduledAt;
    @NotNull @Min(30) @Max(90) private Integer durationMinutes;
    private String agenda;
}