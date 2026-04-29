package com.sarthak.skillbuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilityDTO {
    private Long id;

    // US03 AC1 — day + time slot
    @NotBlank(message = "Please provide a valid day of week")
    private String dayOfWeek;

    @NotNull(message = "Please provide a valid start time")
    private String startTime;

    @NotNull(message = "Please provide a valid end time")
    private String endTime;

    // US03 AC2 — recurring weekly pattern
    private boolean recurring;

    // US03 AC4 — timezone
    private String timezone;

    // US03 AC3 — block-off dates list (e.g. vacation)
    private List<String> blockedDates;   // ISO format: ["2025-08-10", "2025-08-11"]
}