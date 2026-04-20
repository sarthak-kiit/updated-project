package com.sarthak.skillbuilder.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    // No token field — using session based auth
    private String email;
    private String fullName;
    private String role;
    private Long userId;
}