package com.sarthak.skillbuilder.service;

import com.sarthak.skillbuilder.dto.ReportDTO;
import com.sarthak.skillbuilder.dto.ReportRequestDTO;
import com.sarthak.skillbuilder.entity.Report;
import com.sarthak.skillbuilder.entity.User;
import com.sarthak.skillbuilder.exception.BadRequestException;
import com.sarthak.skillbuilder.exception.DuplicateResourceException;
import com.sarthak.skillbuilder.exception.ResourceNotFoundException;
import com.sarthak.skillbuilder.exception.UnauthorizedException;
import com.sarthak.skillbuilder.repository.ReportRepository;
import com.sarthak.skillbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    // US18 — Submit a report
    @Transactional
    public ReportDTO submitReport(Long reporterId, ReportRequestDTO request) {

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));

        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReportedUserId()));

        // Cannot report yourself
        if (reporterId.equals(request.getReportedUserId()))
            throw new BadRequestException("Please provide a valid reportedUserId: you cannot report yourself");

        // Prevent duplicate reports from same reporter to same user
        if (reportRepository.existsByReporterAndReportedUser(reporter, reportedUser))
            throw new DuplicateResourceException("You have already submitted a report against this user");

        // Parse and validate violation category
        Report.ViolationCategory category;
        try {
            category = Report.ViolationCategory.valueOf(request.getCategory().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Please provide a valid category");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .category(category)
                .description(request.getDescription().trim())
                .status(Report.ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        log.info("Report #{} submitted by userId:{} against userId:{} — category:{}",
                saved.getId(), reporterId, request.getReportedUserId(), category);

        return toDTO(saved);
    }

    // US18 — Get reports filed by the current user (so they can track resolution)
    public List<ReportDTO> getMyReports(Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));
        return reportRepository.findByReporterOrderByCreatedAtDesc(reporter)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Admin — Get all pending reports
    public List<ReportDTO> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Admin — Get reports by status
    public List<ReportDTO> getReportsByStatus(String statusStr) {
        Report.ReportStatus status;
        try {
            status = Report.ReportStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Please provide a valid status");
        }
        return reportRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Admin — Resolve or dismiss a report
    @Transactional
    public ReportDTO resolveReport(Long reportId, Long adminId, String newStatus, String adminNote) {

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        if (admin.getRole() != User.Role.ADMIN)
            throw new UnauthorizedException("Only admins can resolve reports");

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        Report.ReportStatus status;
        try {
            status = Report.ReportStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Please provide a valid status");
        }

        report.setStatus(status);
        if (adminNote != null && !adminNote.isBlank())
            report.setAdminNote(adminNote.trim());

        Report saved = reportRepository.save(report);
        log.info("Report #{} resolved by admin:{} — new status:{}", reportId, adminId, status);
        return toDTO(saved);
    }

    // ── Mapper ──────────────────────────────────────────────────────
    private ReportDTO toDTO(Report r) {
        return ReportDTO.builder()
                .id(r.getId())
                .reporterId(r.getReporter().getId())
                .reporterName(r.getReporter().getFullName())
                .reportedUserId(r.getReportedUser().getId())
                .reportedUserName(r.getReportedUser().getFullName())
                .category(r.getCategory().name())
                .description(r.getDescription())
                .status(r.getStatus().name())
                .adminNote(r.getAdminNote())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}