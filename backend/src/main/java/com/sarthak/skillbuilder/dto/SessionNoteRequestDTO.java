package com.sarthak.skillbuilder.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionNoteRequestDTO {

    @NotNull(message = "Please provide a valid sessionId")
    private Long sessionId;

    // Personal notes — optional
    private String notes;

    // Skills discussed in this session — optional list
    private List<String> skillsTags;
}