package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.RemoveCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMaxMembersRequestDTO;
import com.gvw.gvwbackend.dto.response.AppSettingsResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.AppSettings;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AppSettingsService {
  private static final Logger log = LoggerFactory.getLogger(AppSettingsService.class);
  private DbService dbService;

  public AppSettingsService(DbService dbService) {
    this.dbService = dbService;
  }

  public AppSettingsResponseDTO getAppSettings() {
    AppSettings settings = appSettings();

    return new AppSettingsResponseDTO(settings.getMaxMembers(), settings.getScoreCategories());
  }

  public void updateMaxMembers(UpdateMaxMembersRequestDTO requestDTO) {
    if (requestDTO.maxMembers() < 0) {
      throw new BadRequestException("MaxMembersIsNegativ");
    }

    AppSettings settings = appSettings();
    settings.setMaxMembers(requestDTO.maxMembers());

    dbService.update("app_settings", settings);
  }

  public void addCategory(AddCategoryRequestDTO requestDTO) {
    Set<String> blocked = new HashSet<>();
    blocked.add("__proto__");
    blocked.add("constructor");
    blocked.add("prototype");

    if (requestDTO.type() == null
        || requestDTO.displayName() == null
        || blocked.contains(requestDTO.type())
        || blocked.contains(requestDTO.displayName())) {
      throw new BadRequestException("InvalidCategory");
    }

    AppSettings settings = appSettings();
    Map<String, String> categories = settings.getScoreCategories();

    if (categories.containsKey(requestDTO.type())
        || categories.containsKey(requestDTO.displayName())) {
      throw new BadRequestException("CategoryAlreadyExists");
    }

    categories.put(requestDTO.type(), requestDTO.displayName());
    categories.put(requestDTO.displayName(), requestDTO.type());

    settings.setScoreCategories(categories);

    dbService.update("app_settings", settings);
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
