package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.config.PasswordUtil;
import com.sarthak.skillbuilder.dto.AuthResponse;
import com.sarthak.skillbuilder.dto.LoginRequest;
import com.sarthak.skillbuilder.dto.RegisterRequest;
import com.sarthak.skillbuilder.entity.MenteeProfile;
import com.sarthak.skillbuilder.entity.MentorProfile;
import com.sarthak.skillbuilder.entity.User;
import com.sarthak.skillbuilder.exception.DuplicateResourceException;
import com.sarthak.skillbuilder.exception.UnauthorizedException;
import com.sarthak.skillbuilder.repository.MenteeProfileRepository;
import com.sarthak.skillbuilder.repository.MentorProfileRepository;
import com.sarthak.skillbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MenteeProfileRepository menteeProfileRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException(
                "Email already registered: " + request.getEmail());

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(PasswordUtil.encode(request.getPassword()))
                .role(request.getRole())
                .emailVerified(false)
                .active(true)
                .build();
        userRepository.save(user);
        log.info("New user registered: {} as {}", user.getEmail(), user.getRole());

        // Auto-create mentor profile
        if (user.getRole() == User.Role.MENTOR) {
            mentorProfileRepository.save(MentorProfile.builder()
                    .user(user)
                    .averageRating(0.0)
                    .totalSessions(0)
                    .totalReviews(0)
                    .build());
            log.info("Mentor profile auto-created for: {}", user.getEmail());
        }

        // Auto-create mentee profile
        if (user.getRole() == User.Role.MENTEE) {
            menteeProfileRepository.save(MenteeProfile.builder()
                    .user(user)
                    .build());
            log.info("Mentee profile auto-created for: {}", user.getEmail());
        }

        return AuthResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!PasswordUtil.matches(request.getPassword(), user.getPassword()))
            throw new UnauthorizedException("Invalid email or password");

        if (!user.isActive())
            throw new UnauthorizedException("Account is deactivated");

        log.info("User logged in: {} as {}", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
}
