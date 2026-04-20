package com.sarthak.skillbuilder.dto;
import lombok.*;
import java.time.LocalDateTime;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionDTO {
    private Long id; 
    private Long mentorId;
    private String mentorName; 
    private String mentorProfileImageUrl;
    private Long menteeId; 
    private String menteeName; 
    private LocalDateTime scheduledAt;
    private Integer durationMinutes; 
    private String agenda; 
    private String status;
    private String rejectionReason; 
    private LocalDateTime createdAt;
}