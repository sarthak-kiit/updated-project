package com.sarthak.skillbuilder.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String bio;
    private String location;
    private String profileImageUrl;
    private List<String> industries;
    private boolean active;
    private LocalDateTime createdAt;
}
