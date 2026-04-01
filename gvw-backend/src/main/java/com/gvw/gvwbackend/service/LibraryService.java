package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddScoreRequestDTO;
import com.gvw.gvwbackend.dto.response.ScoreResponseDTO;
import com.gvw.gvwbackend.dto.response.ScoresResponseDTO;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.model.Score;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

@Service
public class LibraryService {
  private final DbService dbService;
  private final ObjectMapper mapper = new ObjectMapper();

  @Value("${scores.directory:./data/scores}")
  private String scoresDir;

  public LibraryService(DbService dbService) {
    this.dbService = dbService;
  }

  public ScoresResponseDTO getAllScores() {
    List<Map<String, Object>> scoresRaw = dbService.findAll("library");

    List<Score> scores =
        scoresRaw.stream().map(map -> mapper.convertValue(map, Score.class)).toList();

    if (scores.isEmpty()) {
      return new ScoresResponseDTO(List.of());
    }

    List<ScoreResponseDTO> responseScores =
        scores.stream()
            .map(
                m ->
                    new ScoreResponseDTO(
                        m.getId(),
                        m.getScoreId(),
                        m.getTitle(),
                        m.getArtist(),
                        m.getType(),
                        m.getVoices(),
                        m.getVoiceCount(),
                        m.getFiles() != null
                            ? m.getFiles().stream().map(Score.File::getOriginalName).toList()
                            : List.of()))
            .toList();

    return new ScoresResponseDTO(responseScores);
  }

  public void createScore(AddScoreRequestDTO request, List<MultipartFile> files) {
      if (existsInLibrary(request.scoreId(), request.title(), request.artist())) {
          throw new ConflictException("ScoreAlreadyExists");
      }

      List<Score.File> storedFiles = storeFiles(files);

      Score score = Score.builder()
              .scoreId(request.scoreId())
              .title(request.title())
              .artist(request.artist())
              .type(request.type())
              .voices(request.voices())
              .voiceCount(Integer.parseInt(request.voiceCount()))
              .files(storedFiles)
              .build();

      dbService.insert("library", score);
  }

  private List<Score.File> storeFiles(List<MultipartFile> files) {
      List<Score.File> storedFiles = new ArrayList<>();
      Path root = Paths.get(scoresDir);

      try {
          Files.createDirectories(root);

          for (MultipartFile file : files) {
              String id = UUID.randomUUID().toString();
              String originalName = file.getOriginalFilename();

              if (originalName == null) continue;
              String extension = originalName.substring(originalName.lastIndexOf("."));

              String storedName = id + extension;
              Files.copy(file.getInputStream(), root.resolve(storedName));

              storedFiles.add(new Score.File(
                      id,
                      originalName,
                      file.getContentType(),
                      file.getSize(),
                      extension.replace(".", "")
              ));
          }
      } catch (IOException e) {
          throw new RuntimeException("FileSystemError", e);
      }
      return storedFiles;
  }

  private void deleteFile(String fileName) {
      Path filePath = Paths.get(scoresDir, fileName);

      try {
          Files.deleteIfExists(filePath);
      } catch (IOException e) {
          throw new RuntimeException("FileSystemError", e);
      }
  }

  private boolean existsInLibrary(String scoreId, String title, String artist) {
      Map<String, Object> query = Map.of("selector", Map.of("scoreId", scoreId, "title", title, "artist", artist));
      List<Score> result = dbService.findByQuery("library", query, Score.class);

      return result != null && !result.isEmpty();
  }
}
