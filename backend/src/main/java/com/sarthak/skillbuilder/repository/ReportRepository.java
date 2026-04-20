package com.sarthak.skillbuilder.repository;

import com.sarthak.skillbuilder.entity.Report;
import com.sarthak.skillbuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // All reports filed by a specific user
    List<Report> findByReporterOrderByCreatedAtDesc(User reporter);

    // All reports against a specific user (for admin)
    List<Report> findByReportedUserOrderByCreatedAtDesc(User reportedUser);

    // All reports by status (for admin dashboard)
    List<Report> findByStatusOrderByCreatedAtDesc(Report.ReportStatus status);

    // All reports — admin view
    List<Report> findAllByOrderByCreatedAtDesc();

    // Check if this reporter already reported this user
    boolean existsByReporterAndReportedUser(User reporter, User reportedUser);
}