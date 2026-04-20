package com.sarthak.skillbuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_mentors",
       uniqueConstraints = @UniqueConstraint(columnNames = {"mentee_id", "mentor_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteMentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentee_id", nullable = false)
    private User mentee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}