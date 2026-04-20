package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// US23 — Mentee progress tracking
// Stores personal notes + skill tags for a completed session
@Entity
@Table(name = "session_notes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "mentee_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One note per session per mentee
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentee_id", nullable = false)
    private User mentee;

    // US23: "Mentee can add personal notes on progress after each session"
    @Column(columnDefinition = "TEXT")
    private String notes;

    // US23: "Skills discussed in each session are tagged and trackable"
    // Stored as comma-separated string for simplicity — no extra join table needed
    @Column(columnDefinition = "TEXT")
    private String skillsTags; // e.g. "Spring Boot,Microservices,REST APIs"

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}