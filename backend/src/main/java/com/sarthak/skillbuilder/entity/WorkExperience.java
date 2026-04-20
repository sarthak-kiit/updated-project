package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "work_experiences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    private String companyName;
    private String jobTitle;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean currentJob;

    @Column(columnDefinition = "TEXT")
    private String description;
}