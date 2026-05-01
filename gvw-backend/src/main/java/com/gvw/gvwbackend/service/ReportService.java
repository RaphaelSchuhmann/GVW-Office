package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddReportRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateReportDescriptionRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateReportRequestDTO;
import com.gvw.gvwbackend.dto.response.*;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.*;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

@Service
public class ReportService {
  private final DbService dbService;
  private final SseService sseService;
  private final ObjectMapper mapper = new ObjectMapper();
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);

  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

  @Value("${reports.directory:./api-data/reports}")
  private String filesDir;

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
    report.setContents(List.of());

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
        report.getId(),
        report.getTitle(),
        report.getAuthor(),
        report.getRev(),
        words.size() / 200,
        report.getContents());
  }

  public AttachmentResource getReportImage(String reportId, String filename) {
    if (reportId == null || reportId.isBlank() || filename == null || filename.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    if (filename.contains("..") || filename.contains("/")) {
      throw new BadRequestException("InvalidFileName");
    }

    Path filePath = Paths.get(filesDir, filename);
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

  public AttachmentResource getReportFile(String reportId, String filename) {
    if (reportId == null || reportId.isBlank() || filename == null || filename.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    if (filename.contains("..") || filename.contains("/")) {
      throw new BadRequestException("InvalidFileName");
    }

    Path filePath = Paths.get(filesDir, filename);
    File file = filePath.toFile();

    if (!file.exists()) {
      throw new NotFoundException("FileNotFound");
    }

    try {
      String contentType = Files.probeContentType(filePath);

      if (contentType == null || contentType.isBlank()) {
        contentType = "application/octet-stream";
      }

      return new AttachmentResource(new FileInputStream(file), contentType);
    } catch (IOException exception) {
      throw new RuntimeException("ErrorLoadingFile", exception);
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

    List<String> files = getFilenames(report);

    if (!files.isEmpty()) {
      for (String file : files) {
        // Handle file block data
        if (file.contains(":")) {
          int index = file.indexOf(":");
          file = file.substring(index + 1);
        }

        deleteFile(file);
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
      URI uri = new URI(url);

      if (!"https".equalsIgnoreCase(uri.getScheme())) {
        throw new BadRequestException("InvalidScheme");
      }

      String host = uri.getHost();
      if (host == null) {
        throw new BadRequestException("InvalidHost");
      }

      InetAddress[] addresses = InetAddress.getAllByName(host);

      for (InetAddress address : addresses) {
        if (isBlockedAddress(address)) {
          throw new BadRequestException("BlockedIPRange");
        }
      }

      InetAddress[] addresses2 = InetAddress.getAllByName(host);
      if (addresses.length != addresses2.length) {
        throw new IllegalArgumentException("DNS rebind detected");
      }

      Document doc =
              Jsoup.connect(uri.toString())
                      .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                      .timeout(5000)
                      .get();

      String title = doc.title();
      if (title.isBlank()) {
        title = url;
      }

      String favicon;
      Element iconElement =
              doc.head().select("link[rel~=(?i)^(shortcut|icon|apple-touch-icon)$]").first();

      if (iconElement != null) {
        favicon = iconElement.attr("abs:href");
      } else {
        favicon = uri.getScheme() + "://" + host + "/favicon.ico";
      }

      return new LinkMetadataResponseDTO(title, favicon);
    } catch (Exception e) {
      return new LinkMetadataResponseDTO(url, "");
    }
  }

  public String updateReport(UpdateReportRequestDTO request, List<MultipartFile> files) {
    Report report = dbService.findById("reports", request.id(), Report.class);
    if (report == null) {
      throw new NotFoundException("ReportNotFound");
    }

    List<String> newlyUploadedFiles = new ArrayList<>();

    try {
      if (files != null && !files.isEmpty()) {
        newlyUploadedFiles = storeFiles(files);
      }

      Set<String> originalFileIds = extractFileIds(report.getContents());
      Set<String> updatedFileIds = extractFileIds(request.content());
      Set<String> removedFiles = new HashSet<>(originalFileIds);
      removedFiles.removeAll(updatedFileIds);

      report.setTitle(request.title());
      report.setLastEditedBy(request.editor());
      report.setContents(request.content());
      report.setRev(request.rev());

      Map<String, Object> resp = dbService.update("reports", report.getId(), report);

      if (resp == null || !resp.containsKey("rev")) {
        throw new RuntimeException("FailedToRetrieveNewRevsFromDB");
      }

      if (!removedFiles.isEmpty()) {
        for (String file : removedFiles) {
          deleteFile(file);
        }
      }

      try {
        sseService.broadcastRefresh("REPORTS");
      } catch (RuntimeException ex) {
        log.warn("Failed to broadcast REPORTS refresh: ", ex);
      }

      return (String) resp.get("rev");
    } catch (Exception e) {
      log.error("Update failed. Rolling back new uploads.", e);

      for (String newFile : newlyUploadedFiles) {
        deleteFile(newFile);
      }

      if (e instanceof RuntimeException) throw (RuntimeException) e;
      throw new RuntimeException("UpdateOperationFailed", e);
    }
  }

  public String updateReportDescription(UpdateReportDescriptionRequestDTO request) {
    String description = request.description();

    if (description.isBlank()) {
      description = "Keine Beschreibung";
    }

    Report report = dbService.findById("reports", request.id(), Report.class);
    if (report == null) {
      throw new NotFoundException("ReportNotFound");
    }

    report.setDescription(description);
    report.setRev(request.rev());

    Map<String, Object> resp = dbService.update("reports", report.getId(), report);

    if (resp == null || !resp.containsKey("rev")) {
      throw new RuntimeException("FailedToRetrieveNewRevsFromDB");
    }

    try {
      sseService.broadcastRefresh("REPORTS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }

    return (String) resp.get("rev");
  }

  private String getContentsAsString(Report report) {
    if (report == null) return "";

    List<TextEditorBlock> contents = report.getContents();

    if (contents == null || contents.isEmpty()) return "";

    StringBuilder sb = new StringBuilder();

    for (TextEditorBlock block : contents) {
      if (block.getType() == TextEditorBlockType.IMAGE
          || block.getType() == TextEditorBlockType.FILE) continue;

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

  private List<String> getFilenames(Report report) {
    if (report == null) {
      return List.of();
    }

    List<String> filenames = new ArrayList<>();

    List<TextEditorBlock> content = report.getContents();
    if (content == null || content.isEmpty()) return filenames;

    for (TextEditorBlock block : content) {
      if (block.getType() != TextEditorBlockType.IMAGE
          && block.getType() != TextEditorBlockType.FILE) continue;

      filenames.add(block.getData());
    }

    return filenames;
  }

  private void deleteFile(String fileName) {
    Path filePath = Paths.get(filesDir, fileName);

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

  private List<String> storeFiles(List<MultipartFile> files) throws IOException {
    if (files == null || files.isEmpty()) return List.of();

    List<String> filenames = new ArrayList<>();
    List<Path> physicalPaths = new ArrayList<>();
    Path root = Paths.get(filesDir);

    try {
      Files.createDirectories(root);

      for (MultipartFile file : files) {
        if (file.getSize() > MAX_FILE_SIZE) {
          throw new BadRequestException("FileSizeTooLarge");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) continue;

        String id = UUID.randomUUID().toString();
        int dotIndex = originalName.lastIndexOf('.');
        String extensionWithDot = (dotIndex == -1) ? "" : originalName.substring(dotIndex);

        Path targetPath = root.resolve(id + extensionWithDot);

        Files.copy(file.getInputStream(), targetPath);

        filenames.add(id + extensionWithDot);
        physicalPaths.add(targetPath);
      }
    } catch (Exception e) {
      log.error("Internal file storage failed. Cleaning up partial uploads...", e);
      for (Path path : physicalPaths) {
        try {
          Files.deleteIfExists(path);
        } catch (IOException cleanupEx) {
          log.warn("Failed to clean up partial upload: {}", path, cleanupEx);
        }
      }

      throw new RuntimeException("FileSystemError", e);
    }

    return filenames;
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

  private Set<String> extractFileIds(List<TextEditorBlock> content) {
    Set<String> ids = new HashSet<>();

    if (content == null || content.isEmpty()) {
      return ids;
    }

    for (TextEditorBlock block : content) {
      if (block.getType() != TextEditorBlockType.FILE
          && block.getType() != TextEditorBlockType.IMAGE) continue;

      if (block.getType() == TextEditorBlockType.FILE && block.getData().contains(":")) {
        int i = block.getData().indexOf(":");
        ids.add(block.getData().substring(i + 1));
        continue;
      }

      ids.add(block.getData());
    }

    return ids;
  }

  private boolean isBlockedAddress(InetAddress addr) {
    return addr.isAnyLocalAddress()
            || addr.isLoopbackAddress()
            || addr.isLinkLocalAddress()
            || addr.isSiteLocalAddress();
  }
}
