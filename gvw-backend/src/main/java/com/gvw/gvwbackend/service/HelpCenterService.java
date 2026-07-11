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

  public void categoryExists(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(
              String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.CHECK, 400, ErrorResource.HELP_CENTER_CATEGORY)));
    }

    AppSettings settings = appSettingsService.appSettings(ErrorAction.CHECK, ErrorResource.HELP_CENTER_CATEGORY);
    List<HelpCenterCategory> categories = settings.getHelpCenterCategories();

    if (categories.stream().noneMatch(obj -> obj.getId().equals(id))) {
      throw new NotFoundException(String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.CHECK, 404, ErrorResource.HELP_CENTER_CATEGORY)));
    }
  }

  public void articleExists(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(
              String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.CHECK, 400, ErrorResource.HELP_CENTER_ARTICLE)));
    }

    HelpCenterArticle article = dbService.findById("help_center", id, HelpCenterArticle.class);
    if (article == null) {
      throw new NotFoundException(String.valueOf(ErrorDomain.HELP_CENTER.createCode(ErrorAction.CHECK, 404, ErrorResource.HELP_CENTER_ARTICLE)));
    }
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

  public String createArticle(AddHelpCenterArticleRequestDTO dto) {
    // Check if category is valid
    AppSettings settings =
        appSettingsService.appSettings(ErrorAction.CREATE, ErrorResource.HELP_CENTER_ARTICLE);
    List<HelpCenterCategory> categories = settings.getHelpCenterCategories();

    HelpCenterCategory category = categories.stream().filter(obj -> obj.getId().equals(dto.category())).findFirst().orElse(null);

    if (category == null) {
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

    String rev = appSettingsService.updateHelpCenterCategoryArticleCount(dto.category(), category.getArticleCount() + 1);

    try {
      sseService.broadcastRefresh("HELP_CENTER");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast REPORTS refresh: ", ex);
    }

    return rev;
  }

  public ArticlesResponseDTO getArticles(String category) {
    if (category == null || category.isBlank()) {
      throw new BadRequestException(
          String.valueOf(
              ErrorDomain.HELP_CENTER.createCode(
                  ErrorAction.READ_ALL, 400, ErrorResource.HELP_CENTER_ARTICLE)));
    }

    List<HelpCenterArticle> articles = dbService.findByQuery("help_center", Map.of("selector", Map.of("category", category)), HelpCenterArticle.class);

    if (articles == null || articles.isEmpty()) {
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
