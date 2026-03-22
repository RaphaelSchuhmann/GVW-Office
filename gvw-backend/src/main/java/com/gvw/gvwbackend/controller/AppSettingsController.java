package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.RemoveCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMaxMembersRequestDTO;
import com.gvw.gvwbackend.dto.response.AppSettingsResponseDTO;
import com.gvw.gvwbackend.service.AppSettingsService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
public class AppSettingsController {
  private final AppSettingsService appSettingsService;

  public AppSettingsController(AppSettingsService appSettingsService) {
    this.appSettingsService = appSettingsService;
  }

  @GetMapping("/get")
  public AppSettingsResponseDTO getAppSettings() {
    return appSettingsService.getAppSettings();
  }

  @PatchMapping("/update/max-members")
  @ResponseStatus(HttpStatus.OK)
  public void updateMaxMembers(@RequestBody UpdateMaxMembersRequestDTO requestDTO) {
    appSettingsService.updateMaxMembers(requestDTO);
  }

  @PostMapping("/add/category")
  @ResponseStatus(HttpStatus.OK)
  public void addCategory(@Valid @RequestBody AddCategoryRequestDTO requestDTO) {
    appSettingsService.addCategory(requestDTO);
  }

  @DeleteMapping("/remove/category")
  @ResponseStatus(HttpStatus.OK)
  public void removeCategory(@Valid @RequestBody RemoveCategoryRequestDTO requestDTO) {
    appSettingsService.removeCategory(requestDTO);
  }
}
