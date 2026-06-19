package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddReportRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateDocumentAttachmentsDTO;
import com.gvw.gvwbackend.dto.request.UpdateReportDescriptionRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateReportRequestDTO;
import com.gvw.gvwbackend.dto.response.*;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.ErrorAction;
import com.gvw.gvwbackend.exception.ErrorDomain;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.*;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

@Service
public class ReportService {
  private final DbService dbService;
  private final SseService sseService;
  private final TextEditorService editorService;
  private final ObjectMapper mapper = new ObjectMapper();
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);

  public ReportService(
      DbService dbService, SseService sseService, TextEditorService editorService) {
    this.dbService = dbService;
    this.sseService = sseService;
    this.editorService = editorService;
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
      throw new BadRequestException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.CHECK, 400)));
    }

    Report report = dbService.findById("reports", id, Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.CHECK, 404)));
    }
  }

  public void createReport(AddReportRequestDTO request) {
    Report report = new Report();
    report.setTitle(request.title());
    report.setAuthor(request.author());
    report.setDescription(request.description());
    report.setType(request.type());
    report.setCreatedAt(Instant.now().toString());
    report.setLastEditedBy(request.author());

    TextEditorBlock startBlock = new TextEditorBlock();
    startBlock.setId(UUID.randomUUID().toString());
    startBlock.setType(TextEditorBlockType.TEXT);
    startBlock.setData("");
    report.setContents(List.of(startBlock));

    dbService.insert("reports", report);

    try {
      sseService.broadcastRefresh("REPORTS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }
  }

  public FullReportResponseDTO getReport(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.READ_ONE, 400)));
    }

    Report report = dbService.findById("reports", id, Report.class);

    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.READ_ONE, 404)));
    }

    String plainText = editorService.convertBlocksToPlainText(report.getContents());

    List<String> words =
        Arrays.stream(plainText.split("\\s+")).filter(word -> !word.isEmpty()).toList();

    List<String> filenames = new ArrayList<>();

    for (File file : report.getAttachments()) {
      filenames.add(file.getOriginalName());
    }

    return new FullReportResponseDTO(
        report.getId(),
        report.getTitle(),
        report.getAuthor(),
        report.getRev(),
        report.getDescription(),
        words.size() / 200,
        words.size(),
        report.getCreatedAt(),
        report.getLastEditedBy(),
        report.getType(),
        report.getContents(),
        filenames);
  }

  public void verifyAssetOwnership(String documentId, String filename) {
    if (documentId == null || documentId.isBlank() || filename == null || filename.isBlank()) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.TEXT_EDITOR.createCode(ErrorAction.UTILITY, 400)));
    }

    Report report = dbService.findById("reports", documentId, Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.TEXT_EDITOR.createCode(ErrorAction.UTILITY, 404)));
    }

    Set<String> linkedFileIds = editorService.extractFileIds(report.getContents());

    if (!linkedFileIds.contains(filename)) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.TEXT_EDITOR.createCode(ErrorAction.UTILITY, 400)));
    }
  }

  public void deleteReport(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.DELETE, 400)));
    }

    Report report = dbService.findById("reports", id, Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.DELETE, 404)));
    }

    dbService.delete("reports", report.getId(), report.getRev());

    editorService.purgeAllBlockAssets(report.getContents(), ErrorAction.DELETE);

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
      String content = editorService.convertBlocksToPlainText(report.getContents());
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

  public String updateReport(UpdateReportRequestDTO request, List<MultipartFile> files) {
    Report report = dbService.findById("reports", request.id(), Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 404)));
    }

    List<TextEditorBlock> oldContents = report.getContents();
    Map<String, String> newlyUploadedFiles = new HashMap<>();

    try {
      if (files != null && !files.isEmpty()) {
        newlyUploadedFiles = editorService.processUploadedFiles(files, ErrorAction.UPDATE);
      }

      // Update Image block data to permanent internal filenames
      List<TextEditorBlock> blocks = request.content();
      for (TextEditorBlock block : blocks) {
        if (block.getType() != TextEditorBlockType.IMAGE) continue;

        String tempId = block.getData();
        if (tempId.startsWith("temp_")) {
          String realId = newlyUploadedFiles.get(tempId);
          if (realId != null) {
            block.setData(realId);
          } else {
            log.error("Missing file for temp ID: {}", tempId);
            throw new BadRequestException(
                String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 400)));
          }
        }
      }

      report.setTitle(request.title());
      report.setLastEditedBy(request.editor());
      report.setContents(request.content());
      report.setRev(request.rev());

      Map<String, Object> resp = dbService.update("reports", report.getId(), report);

      if (resp == null || !resp.containsKey("rev")) {
        throw new RuntimeException(
            String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 500)));
      }

      editorService.synchronizeBlockAssets(oldContents, request.content(), ErrorAction.UPDATE);

      try {
        sseService.broadcastRefresh("REPORTS");
      } catch (RuntimeException ex) {
        log.warn("Failed to broadcast REPORTS refresh: ", ex);
      }

      return (String) resp.get("rev");
    } catch (Exception e) {
      log.error("Update failed for report ID: {}", request.id(), e);

      if (e instanceof BadRequestException) throw (BadRequestException) e;
      if (e instanceof NotFoundException) throw (NotFoundException) e;

      throw new RuntimeException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 500)), e);
    }
  }

  public String updateReportDescription(UpdateReportDescriptionRequestDTO request) {
    String description = request.description();

    if (description.isBlank()) {
      description = "Keine Beschreibung";
    }

    Report report = dbService.findById("reports", request.id(), Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.TEXT_EDITOR.createCode(ErrorAction.UPDATE, 404)));
    }

    report.setDescription(description);
    report.setRev(request.rev());

    Map<String, Object> resp = dbService.update("reports", report.getId(), report);

    if (resp == null || !resp.containsKey("rev")) {
      throw new RuntimeException(
          String.valueOf(ErrorDomain.TEXT_EDITOR.createCode(ErrorAction.UPDATE, 500)));
    }

    try {
      sseService.broadcastRefresh("REPORTS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }

    return (String) resp.get("rev");
  }

  public String updateAttachments(
      UpdateDocumentAttachmentsDTO request, List<MultipartFile> files, String reportId) {
    if (reportId == null || reportId.isBlank()) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 400)));
    }

    Report report = dbService.findById("reports", reportId, Report.class);
    if (report == null) {
      throw new NotFoundException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 404)));
    }

    if (!report.getRev().equals(request.rev())) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 409)));
    }

    List<File> oldAttachments =
        report.getAttachments() != null ? report.getAttachments() : new ArrayList<>();

    List<File> filesToPurgeFromDisk =
        oldAttachments.stream()
            .filter(file -> !request.attachments().contains(file.getOriginalName()))
            .toList();

    List<File> newlyWrittenFilesToDisk = new ArrayList<>();

    try {
      newlyWrittenFilesToDisk = editorService.storeFiles(files, ErrorAction.UPDATE);

      List<File> finalAttachmentList = new ArrayList<>();

      if (request.attachments() == null || request.attachments().isEmpty()) {
        finalAttachmentList.addAll(newlyWrittenFilesToDisk);
      } else {
        for (String name : request.attachments()) {
          File matchedFile =
              oldAttachments.stream()
                  .filter(old -> old.getOriginalName().equals(name))
                  .findFirst()
                  .orElse(null);

          if (matchedFile == null) {
            matchedFile =
                newlyWrittenFilesToDisk.stream()
                    .filter(newFile -> newFile.getOriginalName().equals(name))
                    .findFirst()
                    .orElse(null);
          }

          if (matchedFile != null) {
            finalAttachmentList.add(matchedFile);
          }
        }
      }

      System.out.println(finalAttachmentList);

      report.setAttachments(finalAttachmentList);
      report.setRev(request.rev());

      Map<String, Object> resp = dbService.update("reports", report.getId(), report);

      if (resp == null || !resp.containsKey("rev") || resp.get("rev").toString().isEmpty()) {
        throw new RuntimeException(
            String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 500)));
      }

      for (File deadFile : filesToPurgeFromDisk) {
        try {
          editorService.deleteAssetFromDisk(
              deadFile.getId() + "." + deadFile.getExtension(), ErrorAction.UPDATE);
        } catch (Exception ex) {
          log.error(
              "Failed to purge unlinked attachment asset from file system: {}",
              deadFile.getId() + "." + deadFile.getExtension(),
              ex);
        }
      }

      try {
        sseService.broadcastRefresh("REPORTS");
      } catch (RuntimeException ex) {
        log.warn("Failed to broadcast REPORTS refresh message: ", ex);
      }

      return (String) resp.get("rev");
    } catch (Exception e) {
      log.error(
          "Attachment update transaction failed for report ID: {}. Triggering system rollback",
          reportId,
          e);

      for (File failedFile : newlyWrittenFilesToDisk) {
        try {
          editorService.deleteAssetFromDisk(
              failedFile.getId() + "." + failedFile.getExtension(), ErrorAction.UPDATE);
        } catch (Exception rollbackEx) {
          log.error(
              "Critical: Failed to remove orphaned file during transaction rollback: {}",
              failedFile.getId() + "." + failedFile.getExtension(),
              rollbackEx);
        }
      }

      if (e instanceof BadRequestException) throw (BadRequestException) e;
      throw new RuntimeException(
          String.valueOf(ErrorDomain.REPORT.createCode(ErrorAction.UPDATE, 500)));
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
