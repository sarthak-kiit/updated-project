package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.SkillAnalyticsDTO;
import com.sarthak.skillbuilder.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * US20 — Admin: view analytics on most requested skills.
 *
 * GET  /admin/analytics/skills?period=week|month|quarter   → top 20 skills JSON
 * GET  /admin/analytics/skills/export?period=...           → CSV download
 */
@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    // US20 AC1 + AC2: top 20 skills, filterable by period
    @GetMapping("/skills")
    public ResponseEntity<List<SkillAnalyticsDTO>> getTopSkills(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(analyticsService.getTopRequestedSkills(period));
    }

    // US20 AC3: export analytics as CSV
    @GetMapping("/skills/export")
    public ResponseEntity<String> exportSkillsCsv(
            @RequestParam(required = false) String period) {

        List<SkillAnalyticsDTO> data = analyticsService.getTopRequestedSkills(period);

        StringBuilder csv = new StringBuilder();
        csv.append("Skill Name,Mentee Requests,Session Tags,Mentors Offering\n");
        for (SkillAnalyticsDTO row : data) {
            csv.append(escape(row.getSkillName())).append(",")
               .append(row.getRequestCount()).append(",")
               .append(row.getSessionCount()).append(",")
               .append(row.getMentorCount()).append("\n");
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition",
                        "attachment; filename=\"skill-analytics-" + periodLabel(period) + ".csv\"")
                .body(csv.toString());
    }

    private String escape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\""))
            return "\"" + value.replace("\"", "\"\"") + "\"";
        return value;
    }

    private String periodLabel(String period) {
        return (period != null && !period.isBlank()) ? period : "all-time";
    }
}
