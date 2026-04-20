package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.SkillAnalyticsDTO;
import com.sarthak.skillbuilder.repository.MenteeDesiredSkillRepository;
import com.sarthak.skillbuilder.repository.MentorSkillRepository;
import com.sarthak.skillbuilder.repository.SessionNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * US20 — Admin analytics on most requested skills.
 *
 * SRS Acceptance Criteria:
 *   AC1: Dashboard shows top 20 requested skills
 *   AC2: Data can be filtered by time period (week, month, quarter)
 *   AC3: Export option available for analytics data (served as CSV by controller)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private final MenteeDesiredSkillRepository desiredSkillRepository;
    private final MentorSkillRepository mentorSkillRepository;
    private final SessionNoteRepository sessionNoteRepository;

    /**
     * US20 AC1 + AC2 — Returns top 20 skills most requested by mentees,
     * enriched with session-tag count and mentor supply count.
     *
     * @param period  "week" | "month" | "quarter" | null (all time)
     */
    public List<SkillAnalyticsDTO> getTopRequestedSkills(String period) {

        LocalDateTime since = resolveSince(period);

        // Step 1: top 20 requested skills from mentee profiles (AC1, AC2)
        List<Object[]> topSkillRows = desiredSkillRepository.findTopRequestedSkills(since);

        // Step 2: session skill-tag counts (from SessionNote CSV tags) — all time
        // These come from /progress notes where mentees tag skills practised in sessions
        Map<String, Long> sessionTagCounts = buildSessionTagCounts();

        // Step 3: mentor supply per skill — all time
        Map<String, Long> mentorSupplyCounts = mentorSkillRepository.findSkillSupplyCount()
                .stream()
                .collect(Collectors.toMap(
                        row -> ((String) row[0]).toLowerCase(),
                        row -> (Long) row[1],
                        (a, b) -> a
                ));

        List<SkillAnalyticsDTO> result = topSkillRows.stream()
                .map(row -> {
                    String skillName = (String) row[0];
                    Long requestCount = (Long) row[1];
                    Long sessionCount = sessionTagCounts.getOrDefault(skillName.toLowerCase(), 0L);
                    Long mentorCount  = mentorSupplyCounts.getOrDefault(skillName.toLowerCase(), 0L);

                    return SkillAnalyticsDTO.builder()
                            .skillName(skillName)
                            .requestCount(requestCount)
                            .sessionCount(sessionCount)
                            .mentorCount(mentorCount)
                            .build();
                })
                .collect(Collectors.toList());

        log.info("US20 — getTopRequestedSkills period={} → {} skills returned", period, result.size());
        return result;
    }

    /**
     * Build a frequency map of skill names from SessionNote skill tag CSVs.
     * SessionNote stores tags as comma-separated string, e.g. "Java,Spring Boot,SQL"
     */
    private Map<String, Long> buildSessionTagCounts() {
        // getAllSkillsTagsByMenteeId already exists; we need all tags across all mentees.
        // We use a native-style JPQL to get all non-null skillsTags from session_notes.
        return sessionNoteRepository.findAllSkillTagStrings()
                .stream()
                .filter(csv -> csv != null && !csv.isBlank())
                .flatMap(csv -> Arrays.stream(csv.split(",")))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isBlank())
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
    }

    // ── Helper: resolve period string to a LocalDateTime cutoff ──────────────
    private LocalDateTime resolveSince(String period) {
        if (period == null || period.isBlank()) return null;
        return switch (period.toLowerCase()) {
            case "week"    -> LocalDateTime.now().minusWeeks(1);
            case "month"   -> LocalDateTime.now().minusMonths(1);
            case "quarter" -> LocalDateTime.now().minusMonths(3);
            default        -> null;  // "all" or unknown → no filter
        };
    }
}