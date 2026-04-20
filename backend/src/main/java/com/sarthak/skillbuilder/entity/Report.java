package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"reporter", "reportedUser"})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who filed the report
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // Who is being reported
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    // US18: predefined violation category
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViolationCategory category;

    // US18: free text explanation
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // US18: admin resolution status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    // Admin resolution note
    @Column(columnDefinition = "TEXT")
    private String adminNote;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ViolationCategory {
        HARASSMENT,
        INAPPROPRIATE_CONTENT,
        SPAM,
        FAKE_PROFILE,
        UNPROFESSIONAL_BEHAVIOUR,
        DISCRIMINATION,
        OTHER
    }

    public enum ReportStatus {
        PENDING,
        UNDER_REVIEW,
        RESOLVED,
        DISMISSED
    }
}