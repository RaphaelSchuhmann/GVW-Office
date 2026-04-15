package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddFeedbackRequestDTO;
import com.gvw.gvwbackend.dto.response.FeedbackDetailsResponseDTO;
import com.gvw.gvwbackend.dto.response.FeedbackResponseDTO;
import com.gvw.gvwbackend.dto.response.FeedbacksResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.ReportMetaData;
import com.gvw.gvwbackend.model.UserFeedback;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackService {
  private final DbService dbService;
  private final SseService sseService;
  private final ObjectMapper mapper = new ObjectMapper();
  private final UserService userService;
  private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

  public FeedbackService(DbService dbService, SseService sseService, UserService userService) {
    this.dbService = dbService;
    this.sseService = sseService;
    this.userService = userService;
  }

  public FeedbacksResponseDTO getFeedbacks() {
    List<Map<String, Object>> rawFeedbacks = dbService.findAll("feedbacks");

    List<UserFeedback> feedbacks = rawFeedbacks.stream().map(map -> mapper.convertValue(map, UserFeedback.class)).toList();

    if (feedbacks.isEmpty()) {
      return new FeedbacksResponseDTO(List.of());
    }

    List<FeedbackResponseDTO> feedbackResponseDTOS = feedbacks.stream().map(
            m -> new FeedbackResponseDTO(
                    m.getId(), m.getTitle(), m.getCategory()
            )
    ).toList();

    return new FeedbacksResponseDTO(feedbackResponseDTOS);
  }

  public FeedbackDetailsResponseDTO getFeedbackDetails(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    UserFeedback feedback = dbService.findById("feedbacks", id, UserFeedback.class);
    if (feedback == null) {
      throw new NotFoundException("FeedbackNotFound");
    }

    return new FeedbackDetailsResponseDTO(
            feedback.getTitle(),
            feedback.getCategory(),
            feedback.getMessage(),
            feedback.getSentiment(),
            userService.resolveUserIdToEmail(feedback.getMetaData().getUserId()),
            feedback.getMetaData().getTimestamp(),
            feedback.getMetaData().getAppVersion(),
            feedback.getMetaData().getRoute()
    );
  }

  public void addFeedback(AddFeedbackRequestDTO request, String userId) {
    if (userId == null || userId.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    UserFeedback feedback = new UserFeedback();
    feedback.setTitle(request.title());
    feedback.setCategory(request.category());
    feedback.setMessage(request.message());
    feedback.setSentiment(request.sentiment());

    ReportMetaData metaData = new ReportMetaData();
    metaData.setUserId(userId);
    metaData.setRoute(request.route());
    metaData.setAppVersion(request.appVersion());
    metaData.setTimestamp(LocalDateTime.now());

    feedback.setMetaData(metaData);

    dbService.insert("feedbacks", feedback);

    try {
      sseService.broadcastRefresh("FEEDBACK");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast FEEDBACK refresh: ", ex);
    }
  }

  public void deleteFeedback(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    UserFeedback feedback = dbService.findById("feedbacks", id, UserFeedback.class);
    if (feedback == null) {
      throw new NotFoundException("FeedbackNotFound");
    }

    dbService.delete("feedbacks", feedback.getId(), feedback.getRev());

    try {
      sseService.broadcastRefresh("FEEDBACK");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast FEEDBACK refresh: ", ex);
    }
  }
}
