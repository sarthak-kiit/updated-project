package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "availabilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    // US03 AC1: day-of-week slot
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    // US03 AC2: recurring weekly pattern flag
    @Column(nullable = false)
    @Builder.Default
    private boolean recurring = true;

    // US03 AC4: timezone clearly stored per slot
    @Column(nullable = false)
    @Builder.Default
    private String timezone = "IST";

    // US03 AC3: block-off dates stored as comma-separated string in DB
    // Format: "2025-08-10,2025-08-11"
    @Column(name = "blocked_dates_raw", columnDefinition = "TEXT")
    private String blockedDatesRaw;

    // Transient helper — not persisted; populated by service after load
    @Transient
    @Builder.Default
    private List<LocalDate> blockedDates = new ArrayList<>();

    /** Called by service after loading from DB to populate the transient list. */
    public void hydrateBlockedDates() {
        blockedDates = new ArrayList<>();
        if (blockedDatesRaw == null || blockedDatesRaw.isBlank()) return;
        for (String s : blockedDatesRaw.split(",")) {
            String trimmed = s.trim();
            if (!trimmed.isBlank()) {
                try { blockedDates.add(LocalDate.parse(trimmed)); }
                catch (Exception ignored) {}
            }
        }
    }

    /** Serialise blockedDates list → raw string before save. */
    public void serializeBlockedDates() {
        if (blockedDates == null || blockedDates.isEmpty()) {
            blockedDatesRaw = null;
            return;
        }
        StringBuilder sb = new StringBuilder();
        for (LocalDate d : blockedDates) {
            if (sb.length() > 0) sb.append(',');
            sb.append(d.toString());
        }
        blockedDatesRaw = sb.toString();
    }
}