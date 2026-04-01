package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddScoreRequestDTO;
import com.gvw.gvwbackend.dto.response.ScoreResponseDTO;
import com.gvw.gvwbackend.dto.response.ScoresResponseDTO;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.model.Score;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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


  }

  private boolean existsInLibrary(String scoreId, String title, String artist) {
      Map<String, Object> query = Map.of("selector", Map.of("scoreId", scoreId, "title", title, "artist", artist));
      List<Score> result = dbService.findByQuery("library", query, Score.class);

      return result != null && !result.isEmpty();
  }
}
