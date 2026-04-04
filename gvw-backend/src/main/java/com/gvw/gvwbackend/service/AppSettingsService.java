package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.RemoveCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMaxMembersRequestDTO;
import com.gvw.gvwbackend.dto.response.AppSettingsResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.exception.NotFoundException;
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
    AppSettings settings = appSettings();

    return new AppSettingsResponseDTO(settings.getMaxMembers(), settings.getScoreCategories());
  }

  public void updateMaxMembers(UpdateMaxMembersRequestDTO requestDTO) {
    if (requestDTO.maxMembers() < 0) {
      throw new BadRequestException("MaxMembersIsNegative");
    }

    AppSettings settings = appSettings();
    settings.setMaxMembers(requestDTO.maxMembers());

    dbService.update("app_settings", settings);

    sseService.broadcastRefresh("SETTINGS");
  }

  public void addCategory(AddCategoryRequestDTO requestDTO) {
    if (requestDTO.type() == null
        || requestDTO.displayName() == null
        || BLOCKED_KEYS.contains(requestDTO.type())
        || BLOCKED_KEYS.contains(requestDTO.displayName())) {
      throw new BadRequestException("InvalidCategory");
    }

    AppSettings settings = appSettings();
    Map<String, String> categories = settings.getScoreCategories();

    if (categories.containsKey(requestDTO.type())
        || categories.containsKey(requestDTO.displayName())) {
      throw new ConflictException("CategoryAlreadyExists");
    }

    categories.put(requestDTO.type(), requestDTO.displayName());
    categories.put(requestDTO.displayName(), requestDTO.type());

    settings.setScoreCategories(categories);

    dbService.update("app_settings", settings);

    sseService.broadcastRefresh("SETTINGS");
  }

  public void removeCategory(RemoveCategoryRequestDTO requestDTO) {
    String type = requestDTO.type();
    if (type == null) {
      throw new BadRequestException("CategoryEmpty");
    }

    AppSettings settings = appSettings();
    Map<String, String> categories = settings.getScoreCategories();

    String displayName = categories.get(type);

    categories.remove(type);
    if (displayName != null) categories.remove(displayName);

    settings.setScoreCategories(categories);
    dbService.update("app_settings", settings);

    sseService.broadcastRefresh("SETTINGS");
  }

  private AppSettings appSettings() {
    AppSettings settings = dbService.findById("app_settings", "general", AppSettings.class);

    if (settings == null) {
      log.error("App settings not found");
      throw new NotFoundException("AppSettingsNotFound");
    }

    return settings;
  }
}
