package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.*;
import com.sarthak.skillbuilder.entity.*;
import com.sarthak.skillbuilder.exception.*;
import com.sarthak.skillbuilder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MentorService {

    // FIX: Removed AvailabilityService injection.
    // It caused @RequiredArgsConstructor / Eclipse compilation errors because
    // the IDE could not resolve the Spring bean dependency in its context.
    // AvailabilityService.toDTO() logic is now inlined in toDTO() below.
    private final MentorProfileRepository mentorProfileRepository;
    private final UserRepository userRepository;

    public List<MentorProfileDTO> getAllMentors() {
        return mentorProfileRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public MentorProfileDTO getMentorById(Long id) {
        return toDTO(mentorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MentorProfile", "id", id)));
    }

    public MentorProfileDTO getMentorByUserId(Long userId) {
        return toDTO(mentorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorProfile", "userId", userId)));
    }

    public List<MentorProfileDTO> searchBySkill(String skill) {
        return mentorProfileRepository.findBySkill(skill).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<MentorProfileDTO> searchByIndustry(String industry) {
        return mentorProfileRepository.findByIndustry(industry).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<MentorProfileDTO> getTopRated() {
        return mentorProfileRepository.findTopRated().stream()
                .limit(10).map(this::toDTO).collect(Collectors.toList());
    }

    // US09
    public List<MentorProfileDTO> getRecommendedForMentee(Long menteeUserId) {
        List<MentorProfile> recommended =
                mentorProfileRepository.findRecommendedForMentee(menteeUserId);
        log.info("US09 — {} matched recommendations for menteeUserId:{}",
                recommended.size(), menteeUserId);
        return recommended.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public MentorProfileDTO createOrUpdateProfile(Long userId, MentorProfileDTO dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getRole() != User.Role.MENTOR)
            throw new BadRequestException("Only mentors can create mentor profiles");

        MentorProfile profile = mentorProfileRepository.findByUserId(userId)
                .orElse(MentorProfile.builder().user(user).build());

        profile.setHeadline(dto.getHeadline());
        profile.setCompany(dto.getCompany());
        profile.setDesignation(dto.getDesignation());
        profile.setYearsOfExperience(dto.getYearsOfExperience());
        profile.setEducation(dto.getEducation());
        profile.setProfessionalSummary(dto.getProfessionalSummary());

        // Industries
        if (dto.getIndustries() != null) {
            profile.getIndustries().clear();
            for (String industryName : dto.getIndustries()) {
                if (industryName != null && !industryName.isBlank()) {
                    profile.getIndustries().add(
                        MentorIndustry.builder()
                            .mentorProfile(profile)
                            .industry(industryName.trim())
                            .build()
                    );
                }
            }
        }

        // Skills
        if (dto.getSkills() != null) {
            profile.getSkills().clear();
            for (SkillDTO s : dto.getSkills()) {
                if (s.getSkillName() != null && !s.getSkillName().isBlank()) {
                    String level = (s.getExpertiseLevel() != null)
                            ? s.getExpertiseLevel().toUpperCase()
                            : "INTERMEDIATE";
                    profile.getSkills().add(
                        MentorSkill.builder()
                            .mentorProfile(profile)
                            .skillName(s.getSkillName().trim())
                            .category(s.getCategory())
                            .expertiseLevel(MentorSkill.ExpertiseLevel.valueOf(level))
                            .build()
                    );
                }
            }
        }

        // Work experiences
        if (dto.getWorkExperiences() != null) {
            profile.getWorkExperiences().clear();
            for (WorkExperienceDTO w : dto.getWorkExperiences()) {
                if (w.getCompanyName() != null && !w.getCompanyName().isBlank()) {
                    profile.getWorkExperiences().add(
                        WorkExperience.builder()
                            .mentorProfile(profile)
                            .companyName(w.getCompanyName().trim())
                            .jobTitle(w.getJobTitle() != null ? w.getJobTitle().trim() : "")
                            .startDate(parseDate(w.getStartDate()))
                            .endDate(w.isCurrentJob() ? null : parseDate(w.getEndDate()))
                            .currentJob(w.isCurrentJob())
                            .description(w.getDescription())
                            .build()
                    );
                }
            }
        }

        // US03 — Availabilities
        // FIX: Replaced nested stream+lambda with enhanced for-loops.
        // The original nested lambda captured 'avail' from the outer lambda scope;
        // Eclipse treated this as a compile error (inner lambda modification of captured var).
        // Plain for-loops are cleaner and have no capture restrictions.
        if (dto.getAvailabilities() != null) {
            profile.getAvailabilities().clear();
            for (AvailabilityDTO a : dto.getAvailabilities()) {
                if (a.getDayOfWeek() == null || a.getStartTime() == null) continue;

                Availability avail = Availability.builder()
                    .mentorProfile(profile)
                    .dayOfWeek(DayOfWeek.valueOf(a.getDayOfWeek().toUpperCase()))
                    .startTime(parseTime(a.getStartTime()))
                    .endTime(parseTime(a.getEndTime()))
                    .recurring(a.isRecurring())
                    .timezone(a.getTimezone() != null ? a.getTimezone() : "IST")
                    .build();

                // AC3: block-off dates
                if (a.getBlockedDates() != null && !a.getBlockedDates().isEmpty()) {
                    List<LocalDate> dates = new ArrayList<>();
                    for (String d : a.getBlockedDates()) {
                        if (d != null && !d.isBlank()) {
                            try {
                                dates.add(LocalDate.parse(d.trim()));
                            } catch (Exception ignored) {
                                log.warn("Invalid blocked date skipped: {}", d);
                            }
                        }
                    }
                    avail.getBlockedDates().addAll(dates);
                    avail.serializeBlockedDates();
                }

                profile.getAvailabilities().add(avail);
            }
        }

        MentorProfile saved = mentorProfileRepository.save(profile);
        log.info("Mentor profile saved for userId: {}", userId);
        return toDTO(saved);
    }

    // ── Private helpers ───────────────────────────────────────────

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            if (dateStr.length() == 7) return LocalDate.parse(dateStr + "-01");
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            log.warn("Could not parse date: {}", dateStr);
            return null;
        }
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return LocalTime.of(9, 0);
        try {
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            log.warn("Could not parse time: {}", timeStr);
            return LocalTime.of(9, 0);
        }
    }

    private MentorProfileDTO toDTO(MentorProfile p) {

        List<String> industries = p.getIndustries() != null
            ? p.getIndustries().stream()
                .map(MentorIndustry::getIndustry)
                .collect(Collectors.toList())
            : Collections.emptyList();

        List<SkillDTO> skills = p.getSkills() != null
            ? p.getSkills().stream()
                .map(s -> SkillDTO.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .category(s.getCategory())
                        .expertiseLevel(s.getExpertiseLevel().name())
                        .build())
                .collect(Collectors.toList())
            : Collections.emptyList();

        List<WorkExperienceDTO> experiences = p.getWorkExperiences() != null
            ? p.getWorkExperiences().stream()
                .map(w -> WorkExperienceDTO.builder()
                        .id(w.getId())
                        .companyName(w.getCompanyName())
                        .jobTitle(w.getJobTitle())
                        .currentJob(w.isCurrentJob())
                        .startDate(w.getStartDate() != null ? w.getStartDate().toString() : null)
                        .endDate(w.getEndDate() != null ? w.getEndDate().toString() : null)
                        .description(w.getDescription())
                        .build())
                .collect(Collectors.toList())
            : Collections.emptyList();

        // US03 — Inline availability DTO mapping (was: availabilityService::toDTO).
        // Inlined to remove the AvailabilityService field dependency from this class.
        // Logic is identical: hydrateBlockedDates() first, then build the DTO.
        List<AvailabilityDTO> availabilities = new ArrayList<>();
        if (p.getAvailabilities() != null) {
            for (Availability a : p.getAvailabilities()) {
                a.hydrateBlockedDates();
                List<String> blockedDateStrings = new ArrayList<>();
                if (a.getBlockedDates() != null) {
                    for (LocalDate d : a.getBlockedDates()) {
                        blockedDateStrings.add(d.toString());
                    }
                }
                availabilities.add(
                    AvailabilityDTO.builder()
                        .id(a.getId())
                        .dayOfWeek(a.getDayOfWeek() != null ? a.getDayOfWeek().name() : null)
                        .startTime(a.getStartTime() != null ? a.getStartTime().toString() : null)
                        .endTime(a.getEndTime() != null ? a.getEndTime().toString() : null)
                        .recurring(a.isRecurring())
                        .timezone(a.getTimezone())
                        .blockedDates(blockedDateStrings)
                        .build()
                );
            }
        }

        return MentorProfileDTO.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .email(p.getUser().getEmail())
                .profileImageUrl(p.getUser().getProfileImageUrl())
                .headline(p.getHeadline())
                .company(p.getCompany())
                .designation(p.getDesignation())
                .yearsOfExperience(p.getYearsOfExperience())
                .education(p.getEducation())
                .professionalSummary(p.getProfessionalSummary())
                .averageRating(p.getAverageRating())
                .totalSessions(p.getTotalSessions())
                .totalReviews(p.getTotalReviews())
                .industries(industries)
                .skills(skills)
                .workExperiences(experiences)
                .availabilities(availabilities)
                .build();
    }
}