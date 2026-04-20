package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.MenteeProfileDTO;
import com.sarthak.skillbuilder.entity.*;
import com.sarthak.skillbuilder.exception.*;
import com.sarthak.skillbuilder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MenteeService {

    private final MenteeProfileRepository menteeProfileRepository;
    private final UserRepository userRepository;

    public MenteeProfileDTO getMenteeByUserId(Long userId) {
        MenteeProfile profile = menteeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "MenteeProfile", "userId", userId));
        return toDTO(profile);
    }

    @Transactional
    public MenteeProfileDTO createOrUpdateProfile(Long userId, MenteeProfileDTO dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getRole() != User.Role.MENTEE)
            throw new BadRequestException("Only mentees can create mentee profiles");

        MenteeProfile profile = menteeProfileRepository.findByUserId(userId)
                .orElse(MenteeProfile.builder().user(user).build());

        // Career objectives → mentee_profiles table
        profile.setCareerObjectives(dto.getCareerObjectives());

        // Interests → mentee_interests table
        if (dto.getInterests() != null) {
            profile.getInterests().clear();
            dto.getInterests().stream()
                .filter(i -> i != null && !i.isBlank())
                .forEach(i -> profile.getInterests().add(
                    MenteeInterest.builder()
                        .menteeProfile(profile)
                        .industryInterest(i.trim())
                        .build()
                ));
        }

        // Desired skills → mentee_desired_skills table
        if (dto.getDesiredSkills() != null) {
            profile.getDesiredSkills().clear();
            dto.getDesiredSkills().stream()
                .filter(s -> s != null && !s.isBlank())
                .forEach(s -> profile.getDesiredSkills().add(
                    MenteeDesiredSkill.builder()
                        .menteeProfile(profile)
                        .skillName(s.trim())
                        .build()
                ));
        }

        // Career goals → mentee_career_goals table
        if (dto.getCareerGoals() != null) {
            profile.getCareerGoals().clear();
            dto.getCareerGoals().stream()
                .filter(g -> g != null && !g.isBlank())
                .forEach(g -> profile.getCareerGoals().add(
                    MenteeCareerGoal.builder()
                        .menteeProfile(profile)
                        .goal(g.trim())
                        .build()
                ));
        }

        MenteeProfile saved = menteeProfileRepository.save(profile);
        log.info("Mentee profile saved for userId: {} | interests: {} | skills: {} | goals: {}",
                userId,
                saved.getInterests().size(),
                saved.getDesiredSkills().size(),
                saved.getCareerGoals().size());

        return toDTO(saved);
    }

    private MenteeProfileDTO toDTO(MenteeProfile p) {

        List<String> interests = p.getInterests() != null
            ? p.getInterests().stream()
                .map(MenteeInterest::getIndustryInterest)
                .collect(Collectors.toList())
            : Collections.emptyList();

        List<String> desiredSkills = p.getDesiredSkills() != null
            ? p.getDesiredSkills().stream()
                .map(MenteeDesiredSkill::getSkillName)
                .collect(Collectors.toList())
            : Collections.emptyList();

        List<String> careerGoals = p.getCareerGoals() != null
            ? p.getCareerGoals().stream()
                .map(MenteeCareerGoal::getGoal)
                .collect(Collectors.toList())
            : Collections.emptyList();

        return MenteeProfileDTO.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .email(p.getUser().getEmail())
                .careerObjectives(p.getCareerObjectives())
                .interests(interests)
                .desiredSkills(desiredSkills)
                .careerGoals(careerGoals)
                .build();
    }
}