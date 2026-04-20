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
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MentorService {

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

    // US09 SRS: "at least 5 recommendations based on industry and skill matches,
    //            prioritising highly-rated mentors"
    // US09 — Profile-based mentor recommendations
    // AC1: "Recommendations appear on dashboard after profile completion"
    // AC2: "At least 5 recommendations based on industry and skill matches"
    // AC3: "Algorithm prioritises highly-rated mentors" — ORDER BY averageRating DESC in JPQL
    public List<MentorProfileDTO> getRecommendedForMentee(Long menteeUserId) {

        // JPQL finds mentors whose industries match mentee's interests
        // OR whose skills match mentee's desiredSkills, ordered by averageRating DESC (AC3)
        // Returns ONLY genuinely matched mentors — no padding with unrelated top-rated mentors.
        // Padding was causing unrelated mentors (and empty profiles like "rishi") to appear.
        List<MentorProfile> recommended =
                mentorProfileRepository.findRecommendedForMentee(menteeUserId);

        log.info("US09 — {} matched recommendations for menteeUserId:{}",
                recommended.size(), menteeUserId);

        return recommended.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MentorProfileDTO createOrUpdateProfile(Long userId, MentorProfileDTO dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getRole() != User.Role.MENTOR)
            throw new BadRequestException("Only mentors can create mentor profiles");

        MentorProfile profile = mentorProfileRepository.findByUserId(userId)
                .orElse(MentorProfile.builder().user(user).build());

        // Basic fields
        profile.setHeadline(dto.getHeadline());
        profile.setCompany(dto.getCompany());
        profile.setDesignation(dto.getDesignation());
        profile.setYearsOfExperience(dto.getYearsOfExperience());
        profile.setEducation(dto.getEducation());   // US01 — was missing, caused null in DB
        profile.setProfessionalSummary(dto.getProfessionalSummary());

        // Industries → mentor_industries table
        if (dto.getIndustries() != null) {
            profile.getIndustries().clear();
            dto.getIndustries().stream()
                .filter(i -> i != null && !i.isBlank())
                .forEach(i -> profile.getIndustries().add(
                    MentorIndustry.builder()
                        .mentorProfile(profile)
                        .industry(i.trim())
                        .build()
                ));
        }

        // Skills → mentor_skills table
        if (dto.getSkills() != null) {
            profile.getSkills().clear();
            dto.getSkills().stream()
                .filter(s -> s.getSkillName() != null && !s.getSkillName().isBlank())
                .forEach(s -> profile.getSkills().add(
                    MentorSkill.builder()
                        .mentorProfile(profile)
                        .skillName(s.getSkillName().trim())
                        .category(s.getCategory())
                        .expertiseLevel(MentorSkill.ExpertiseLevel.valueOf(s.getExpertiseLevel()))
                        .build()
                ));
        }

        // Work experiences → work_experiences table
        if (dto.getWorkExperiences() != null) {
            profile.getWorkExperiences().clear();
            dto.getWorkExperiences().stream()
                .filter(w -> w.getCompanyName() != null && !w.getCompanyName().isBlank())
                .forEach(w -> profile.getWorkExperiences().add(
                    WorkExperience.builder()
                        .mentorProfile(profile)
                        .companyName(w.getCompanyName().trim())
                        .jobTitle(w.getJobTitle() != null ? w.getJobTitle().trim() : "")
                        .startDate(parseDate(w.getStartDate()))
                        .endDate(w.isCurrentJob() ? null : parseDate(w.getEndDate()))
                        .currentJob(w.isCurrentJob())
                        .description(w.getDescription())
                        .build()
                ));
        }

        // Availabilities → availabilities table
        if (dto.getAvailabilities() != null) {
            profile.getAvailabilities().clear();
            dto.getAvailabilities().stream()
                .filter(a -> a.getDayOfWeek() != null && a.getStartTime() != null)
                .forEach(a -> profile.getAvailabilities().add(
                    Availability.builder()
                        .mentorProfile(profile)
                        .dayOfWeek(DayOfWeek.valueOf(a.getDayOfWeek()))
                        .startTime(parseTime(a.getStartTime()))
                        .endTime(parseTime(a.getEndTime()))
                        .recurring(a.isRecurring())
                        .timezone(a.getTimezone() != null ? a.getTimezone() : "IST")
                        .build()
                ));
        }

        MentorProfile saved = mentorProfileRepository.save(profile);
        log.info("Mentor profile saved for userId: {}", userId);
        return toDTO(saved);
    }

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

        List<AvailabilityDTO> availabilities = p.getAvailabilities() != null
            ? p.getAvailabilities().stream()
                .map(a -> AvailabilityDTO.builder()
                        .id(a.getId())
                        .dayOfWeek(a.getDayOfWeek() != null ? a.getDayOfWeek().name() : null)
                        .startTime(a.getStartTime() != null ? a.getStartTime().toString() : null)
                        .endTime(a.getEndTime() != null ? a.getEndTime().toString() : null)
                        .recurring(a.isRecurring())
                        .timezone(a.getTimezone())
                        .build())
                .collect(Collectors.toList())
            : Collections.emptyList();

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
                .education(p.getEducation())            // US01 — was missing, caused null in GET response
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