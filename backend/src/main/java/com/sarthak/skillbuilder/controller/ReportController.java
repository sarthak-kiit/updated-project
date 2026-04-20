package com.sarthak.skillbuilder.controller;

import com.sarthak.skillbuilder.dto.ReportDTO;
import com.sarthak.skillbuilder.dto.ReportRequestDTO;
import com.sarthak.skillbuilder.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // US18 — Any logged-in user submits a report
    @PostMapping("/submit/{reporterId}")
    public ResponseEntity<ReportDTO> submitReport(
            @PathVariable Long reporterId,
            @Valid @RequestBody ReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.submitReport(reporterId, request));
    }

    // US18 — User tracks their own submitted reports
    @GetMapping("/my/{reporterId}")
    public ResponseEntity<List<ReportDTO>> getMyReports(@PathVariable Long reporterId) {
        return ResponseEntity.ok(reportService.getMyReports(reporterId));
    }

    // Admin — View all reports
    @GetMapping("/admin/all")
    public ResponseEntity<List<ReportDTO>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    // Admin — View reports by status
    @GetMapping("/admin/status/{status}")
    public ResponseEntity<List<ReportDTO>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(reportService.getReportsByStatus(status));
    }

    // Admin — Resolve or dismiss a report
    @PutMapping("/admin/{reportId}/resolve")
    public ResponseEntity<ReportDTO> resolveReport(
            @PathVariable Long reportId,
            @RequestParam Long adminId,
            @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "RESOLVED");
        String adminNote = body.getOrDefault("adminNote", "");
        return ResponseEntity.ok(reportService.resolveReport(reportId, adminId, newStatus, adminNote));
    }
}
