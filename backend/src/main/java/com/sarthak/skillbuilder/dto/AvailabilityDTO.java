package com.sarthak.skillbuilder.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilityDTO {
    private Long id;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private boolean recurring;
    private String timezone;
}