package com.sarthak.skillbuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequestDTO {

    @NotNull(message = "Please provide a valid reportedUserId")
    private Long reportedUserId;

    @NotNull(message = "Please provide a valid category")
    private String category;

    @NotBlank(message = "Please provide a valid description")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
}