package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_industries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorIndustry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    @Column(nullable = false)
    private String industry;
}