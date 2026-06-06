package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.RemoveCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMaxMembersRequestDTO;
import com.gvw.gvwbackend.dto.response.AppSettingsResponseDTO;
import com.gvw.gvwbackend.exception.*;
import com.gvw.gvwbackend.model.AppSettings;

import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AppSettingsService {
  private static final Logger log = LoggerFactory.getLogger(AppSettingsService.class);
  private final DbService dbService;
  private final SseService sseService;
  private static final Set<String> BLOCKED_KEYS = Set.of("__proto__", "constructor", "prototype");

  public AppSettingsService(DbService dbService, SseService sseService) {
    this.dbService = dbService;
    this.sseService = sseService;
  }

  public AppSettingsResponseDTO getAppSettings() {
    AppSettings settings = appSettings(ErrorAction.READ_ONE);

    return new AppSettingsResponseDTO(
        settings.getMaxMembers(),
        settings.getScoreCategories(),
        settings.getFeedbackCategories(),
        settings.getAppVersion(),
        settings.getRev());
  }

  public String updateMaxMembers(UpdateMaxMembersRequestDTO requestDTO) {
    AppSettings settings = appSettings(ErrorAction.UPDATE);
    settings.setMaxMembers(requestDTO.maxMembers());
    settings.setRev(requestDTO.rev());

    Map<String, Object> resp = dbService.update("app_settings", settings.getId(), settings);

    Object revObj = resp != null ? resp.get("rev") : null;
    if (!(revObj instanceof String) || ((String) revObj).isBlank()) {
      throw new RuntimeException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.UPDATE, 500)));
    }

    String rev = (String) revObj;
    try {
      sseService.broadcastRefresh("SETTINGS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast SETTINGS refresh: ", ex);
    }
    return rev;
  }

  public String addCategory(AddCategoryRequestDTO requestDTO) {
    if (requestDTO.type() == null
        || requestDTO.displayName() == null
        || BLOCKED_KEYS.contains(requestDTO.type())
        || BLOCKED_KEYS.contains(requestDTO.displayName())) {
      throw new BadRequestException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.UPDATE, 400)));
    }

    AppSettings settings = appSettings(ErrorAction.UPDATE);
    Map<String, String> categories = settings.getScoreCategories();

    if (categories.containsKey(requestDTO.type())
        || categories.containsKey(requestDTO.displayName())) {
      throw new ConflictException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.UPDATE, 409)));
    }

    categories.put(requestDTO.type(), requestDTO.displayName());
    categories.put(requestDTO.displayName(), requestDTO.type());

    settings.setScoreCategories(categories);

    Map<String, Object> resp = dbService.update("app_settings", settings.getId(), settings);

    try {
      sseService.broadcastRefresh("SETTINGS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast SETTINGS refresh: ", ex);
    }

    if (resp != null && resp.containsKey("rev")) {
      return (String) resp.get("rev");
    }

    throw new RuntimeException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.UPDATE, 500)));
  }

  public String removeCategory(RemoveCategoryRequestDTO requestDTO) {
    String type = requestDTO.type();
    if (type == null) {
      throw new BadRequestException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.DELETE, 400)));
    }

    AppSettings settings = appSettings(ErrorAction.DELETE);
    Map<String, String> categories = settings.getScoreCategories();

    String displayName = categories.get(type);

    categories.remove(type);
    if (displayName != null) categories.remove(displayName);

    settings.setScoreCategories(categories);
    Map<String, Object> resp = dbService.update("app_settings", settings.getId(), settings);

    try {
      sseService.broadcastRefresh("SETTINGS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast SETTINGS refresh: ", ex);
    }

    if (resp != null && resp.containsKey("rev")) {
      return (String) resp.get("rev");
    }

    throw new RuntimeException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(ErrorAction.DELETE, 500)));
  }

  private AppSettings appSettings(ErrorAction action) {
    AppSettings settings = dbService.findById("app_settings", "general", AppSettings.class);

    if (settings == null) {
      log.error("App settings not found");
      throw new NotFoundException(String.valueOf(ErrorDomain.APP_SETTINGS.createCode(action, 404)));
    }

    return settings;
  }
}
