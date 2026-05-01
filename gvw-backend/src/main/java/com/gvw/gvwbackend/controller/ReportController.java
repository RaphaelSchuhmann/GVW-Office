package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddReportRequestDTO;
import com.gvw.gvwbackend.dto.response.FullReportResponseDTO;
import com.gvw.gvwbackend.dto.response.LinkMetadataResponseDTO;
import com.gvw.gvwbackend.dto.response.ReportsResponseDTO;
import com.gvw.gvwbackend.dto.response.ReportsSearchResponseDTO;
import com.gvw.gvwbackend.model.AttachmentResource;
import com.gvw.gvwbackend.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/report")
public class ReportController {
  private final ReportService reportService;

  public ReportController(ReportService reportService) {
    this.reportService = reportService;
  }

  @GetMapping("/all")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  public ReportsResponseDTO getReports() {
    return reportService.getReports();
  }

  @GetMapping("/check/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  @ResponseStatus(HttpStatus.OK)
  public void checkReport(@PathVariable String id) {
    reportService.checkReport(id);
  }

  @PostMapping("/add")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  @ResponseStatus(HttpStatus.OK)
  public void addReport(@Valid @RequestBody AddReportRequestDTO request) {
    reportService.createReport(request);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  public FullReportResponseDTO getReport(@PathVariable String id) {
    return reportService.getReport(id);
  }

  @GetMapping("/{id}/images/{filename}")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  public ResponseEntity<Resource> getReportImage(
      @PathVariable String id, @PathVariable String filename) {
    AttachmentResource attachment = reportService.getReportImage(id, filename);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(attachment.getContentType()))
        .body(attachment.getResource());
  }

  @PostMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  public ReportsSearchResponseDTO reportsDeepSearch(@RequestParam("q") String input) {
    return reportService.reportDeepSearch(input);
  }

  @DeleteMapping("/delete/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'SECRETARY')")
  @ResponseStatus(HttpStatus.OK)
  public void deleteReport(@PathVariable String id) {
    reportService.deleteReport(id);
  }

  @GetMapping("/resolve")
  public LinkMetadataResponseDTO resolveLink(@RequestParam("url") String url) {
    return reportService.resolveUrl(url);
  }
}
