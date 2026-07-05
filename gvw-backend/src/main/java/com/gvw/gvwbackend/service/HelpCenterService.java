package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddHelpCenterArticleRequestDTO;
import com.gvw.gvwbackend.dto.response.ArticleResponseDTO;
import com.gvw.gvwbackend.dto.response.ArticlesResponseDTO;
import com.gvw.gvwbackend.exception.*;
import com.gvw.gvwbackend.model.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class HelpCenterService {
  private final DbService dbService;
  private final SseService sseService;
  private final AppSettingsService appSettingsService;
  private final TextEditorService editorService;
  private final ObjectMapper mapper = new ObjectMapper();
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

  public void createArticle(AddHelpCenterArticleRequestDTO dto) {
    // Check if category is valid
    AppSettings settings =
        appSettingsService.appSettings(ErrorAction.CREATE, ErrorResource.HELP_CENTER_ARTICLE);
    List<HelpCenterCategory> categories = settings.getHelpCenterCategories();

    if (categories.stream().noneMatch(obj -> obj.getId().equals(dto.category()))) {
      throw new BadRequestException(
          String.valueOf(
              ErrorDomain.HELP_CENTER.createCode(
                  ErrorAction.CREATE, 404, ErrorResource.HELP_CENTER_CATEGORY)));
    }

    HelpCenterArticle article =
        HelpCenterArticle.builder()
            .title(dto.title())
            .description(dto.description())
            .category(dto.category())
            .tags(dto.tags())
            .build();

    TextEditorBlock startBlock = new TextEditorBlock();
    startBlock.setId(UUID.randomUUID().toString());
    startBlock.setType(TextEditorBlockType.TEXT);
    startBlock.setData("");
    article.setContents(List.of(startBlock));

    dbService.insert("help_center", article);

    try {
      sseService.broadcastRefresh("HELP_CENTER");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }
  }

  public ArticlesResponseDTO getArticles(String category) {
    if (category == null || category.isBlank()) {
      throw new BadRequestException(
          String.valueOf(
              ErrorDomain.HELP_CENTER.createCode(
                  ErrorAction.READ_ALL, 400, ErrorResource.HELP_CENTER_ARTICLE)));
    }

    List<Map<String, Object>> rawArticles = dbService.findAll("help_center");

    List<HelpCenterArticle> articles =
        rawArticles.stream().map(map -> mapper.convertValue(map, HelpCenterArticle.class)).toList();

    if (articles.isEmpty()) {
      return new ArticlesResponseDTO(List.of());
    }

    List<ArticleResponseDTO> responseDTOs =
        articles.stream()
            .map(
                m ->
                    new ArticleResponseDTO(
                        m.getId(), m.getTitle(), m.getDescription(), m.getTags()))
            .toList();
    return new ArticlesResponseDTO(responseDTOs);
  }
}
