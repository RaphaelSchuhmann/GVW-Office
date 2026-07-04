package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.exception.ErrorAction;
import com.gvw.gvwbackend.exception.ErrorDomain;
import com.gvw.gvwbackend.model.HelpCenterArticle;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HelpCenterService {
  private final DbService dbService;
  private final SseService sseService;
  private final AppSettingsService appSettingsService;
  private final TextEditorService editorService;
  private static final Logger log = LoggerFactory.getLogger(HelpCenterService.class);
  private static final long MAX_FILE_SIZE = 8 * 1024 * 1024;

  public HelpCenterService(
      DbService dbService,
      SseService sseService,
      AppSettingsService appSettingsService,
      TextEditorService editorService) {
    this.dbService = dbService;
    this.sseService = sseService;
    this.appSettingsService = appSettingsService;
    this.editorService = editorService;
  }

  public String removeHelpCenterCategory(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(
          String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.DELETE, 400)));
    }

    List<HelpCenterArticle> articles =
        dbService.findByQuery(
            "help_center", Map.of("selector", Map.of("category", id)), HelpCenterArticle.class);
    if (!articles.isEmpty()) {
      throw new ConflictException(
          String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.DELETE, 409)));
    }

    return appSettingsService.removeHelpCenterCategoryFromSettings(id);
  }
}
