package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddReportRequestDTO;
import com.gvw.gvwbackend.dto.response.*;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.*;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class ReportService {
  private final DbService dbService;
  private final SseService sseService;
  private final ObjectMapper mapper = new ObjectMapper();
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);

  @Value("${reports.directory:./api-data/reports}")
  private String imagesDir;

  public ReportService(DbService dbService, SseService sseService) {
    this.dbService = dbService;
    this.sseService = sseService;
  }

  public ReportsResponseDTO getReports() {
    List<Map<String, Object>> rawReports = dbService.findAll("reports");

    List<Report> reports =
        rawReports.stream().map(map -> mapper.convertValue(map, Report.class)).toList();

    if (reports.isEmpty()) {
      return new ReportsResponseDTO(List.of());
    }

    List<ReportResponseDTO> responseDTOS =
        reports.stream()
            .map(
                m ->
                    new ReportResponseDTO(
                        m.getId(),
                        m.getTitle(),
                        m.getAuthor(),
                        m.getType(),
                        m.getDescription(),
                        m.getCreatedAt()))
            .toList();

    return new ReportsResponseDTO(responseDTOS);
  }

  public void checkReport(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Report report = dbService.findById("reports", id, Report.class);
    if (report == null) {
      throw new NotFoundException("ReportNotFound");
    }
  }

  public void createReport(AddReportRequestDTO request) {
    Report report = new Report();
    report.setTitle(request.title());
    report.setAuthor(request.author());
    report.setDescription(request.description());
    report.setType(request.type());

    dbService.insert("reports", report);

    try {
      sseService.broadcastRefresh("REPORTS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }
  }

  public FullReportResponseDTO getReport(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Report report = dbService.findById("reports", id, Report.class);

    if (report == null) {
      throw new NotFoundException("ReportNotFound");
    }

    String contents = getContentsAsString(report);
    List<String> words = Arrays.stream(contents.split("\\s+")).toList();

    return new FullReportResponseDTO(
        report.getId(), report.getTitle(), report.getAuthor(), report.getRev(), words.size() / 200, report.getContents());
  }

  public AttachmentResource getReportImage(String reportId, String filename) {
    if (reportId == null || reportId.isBlank() || filename == null || filename.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    if (filename.contains("..") || filename.contains("/")) {
      throw new SecurityException("Invalid filename");
    }

    Path filePath = Paths.get(imagesDir, filename);
    File file = filePath.toFile();

    if (!file.exists()) {
      throw new NotFoundException("ImageNotFound");
    }

    try {
      String contentType = Files.probeContentType(filePath);

      if (contentType == null || contentType.isBlank()) {
        contentType = "application/octet-stream";
      }

      return new AttachmentResource(new FileInputStream(file), contentType);
    } catch (IOException exception) {
      throw new RuntimeException("ErrorLoadingImage", exception);
    }
  }

  public void deleteReport(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Report report = dbService.findById("reports", id, Report.class);
    if (report == null) {
      throw new NotFoundException("ReportNotFound");
    }

    List<String> images = getImageFilenames(report);

    if (!images.isEmpty()) {
      for (String image : images) {
        deleteFile(image);
      }
    }

    dbService.delete("reports", report.getId(), report.getRev());

    try {
      sseService.broadcastRefresh("REPORTS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }
  }

  public ReportsSearchResponseDTO reportDeepSearch(String input) {
    if (input == null || input.isBlank()) {
      return new ReportsSearchResponseDTO(List.of());
    }

    List<Map<String, Object>> rawReports = dbService.findAll("reports");

    List<Report> reports =
        rawReports.stream().map(map -> mapper.convertValue(map, Report.class)).toList();

    if (reports.isEmpty()) {
      return new ReportsSearchResponseDTO(List.of());
    }

    String regex = "(?i)" + Pattern.quote(input);
    Pattern pattern = Pattern.compile(regex);

    List<ReportSearchResult> results = new ArrayList<>();

    for (Report report : reports) {
      String content = getContentsAsString(report);
      if (content.isBlank()) continue;

      Matcher matcher = pattern.matcher(content);

      if (matcher.find()) {
        int start = matcher.start();
        int end = matcher.end();
        String snippet = extractSnippet(content, start, end);
        results.add(new ReportSearchResult(report, snippet));
      }
    }

    List<ReportSearchResponseDTO> responseDTOS =
        results.stream()
            .map(
                m ->
                    new ReportSearchResponseDTO(
                        m.getReport().getId(),
                        m.getReport().getTitle(),
                        m.getReport().getAuthor(),
                        m.getReport().getType(),
                        m.getSnippet(),
                        m.getReport().getCreatedAt()))
            .toList();

    return new ReportsSearchResponseDTO(responseDTOS);
  }

  public LinkMetadataResponseDTO resolveUrl(String url) {
    try {
      Document doc = Jsoup.connect(url)
              .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
              .timeout(5000)
              .get();

      String title = doc.title();
      if (title.isBlank()) {
        title = url;
      }

      String favicon;
      Element iconElement = doc.head().select("link[rel~=(?i)^(shortcut|icon|apple-touch-icon)$]").first();

      if (iconElement != null) {
        favicon = iconElement.attr("abs:href");
      } else {
        favicon = url.substring(0, url.indexOf("/", 8)) + "/favicon.ico";
      }

      return new LinkMetadataResponseDTO(title, favicon);
    } catch (Exception e) {
      return new LinkMetadataResponseDTO(url, "");
    }
  }

  private String getContentsAsString(Report report) {
    if (report == null) return "";

    List<TextEditorBlock> contents = report.getContents();

    if (contents.isEmpty()) return "";

    StringBuilder sb = new StringBuilder();

    for (TextEditorBlock block : contents) {
      if (block.getType() == TextEditorBlockType.IMAGE) continue;

      String data = block.getData();
      if (data == null || data.isEmpty()) continue;

      String cleanData = data.replaceAll("\\*\\*|/|__", "");

      if (!sb.isEmpty()) {
        sb.append(" ");
      }
      sb.append(cleanData);
    }

    return sb.toString();
  }

  private List<String> getImageFilenames(Report report) {
    if (report == null) {
      return List.of();
    }

    List<String> filenames = new ArrayList<>();

    List<TextEditorBlock> content = report.getContents();

    for (TextEditorBlock block : content) {
      if (block.getType() != TextEditorBlockType.IMAGE) continue;

      filenames.add(block.getData());
    }

    return filenames;
  }

  private void deleteFile(String fileName) {
    Path filePath = Paths.get(imagesDir, fileName);

    if (!Files.exists(filePath)) {
      log.info("File not found on disk while deleting, skipping: {}", filePath);
      return;
    }

    try {
      Files.deleteIfExists(filePath);
    } catch (IOException e) {
      throw new RuntimeException("FileSystemError", e);
    }
  }

  private String extractSnippet(String content, int hitStart, int hitEnd) {
    int start;
    int end;

    if (hitStart <= 50) {
      start = 0;
    } else {
      start = hitStart - 50;
    }

    end = Math.min(hitEnd + 50, content.length());

    return content.substring(start, end);
  }
}
