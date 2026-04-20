package com.sarthak.skillbuilder.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

// US23 — DTO for session notes + skill tags
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionNoteDTO {

    private Long id;

    // Session info — for progress timeline display
    private Long sessionId;
    private String mentorName;
    private LocalDateTime sessionDate;
    private Integer durationMinutes;
    private String agenda;

    // US23: personal notes
    private String notes;

    // US23: skills discussed — returned as list for frontend display
    private List<String> skillsTags;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}