package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentee_career_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenteeCareerGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentee_profile_id", nullable = false)
    private MenteeProfile menteeProfile;

    @Column(nullable = false)
    private String goal;
}