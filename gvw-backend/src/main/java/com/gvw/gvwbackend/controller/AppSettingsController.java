package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.RemoveCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMaxMembersRequestDTO;
import com.gvw.gvwbackend.dto.response.AppSettingsResponseDTO;
import com.gvw.gvwbackend.service.AppSettingsService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER')")
  public Map<String, Object> updateMaxMembers(
      @Valid @RequestBody UpdateMaxMembersRequestDTO requestDTO) {
    String rev = appSettingsService.updateMaxMembers(requestDTO);
    return Map.of("rev", rev);
  }

  @PostMapping("/add/category")
  @ResponseStatus(HttpStatus.OK)
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'LIBRARIAN', 'CONDUCTOR')")
  public Map<String, Object> addCategory(@Valid @RequestBody AddCategoryRequestDTO requestDTO) {
    String rev = appSettingsService.addCategory(requestDTO);
    return Map.of("rev", rev);
  }

  @PostMapping("/remove/category")
  @ResponseStatus(HttpStatus.OK)
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER', 'LIBRARIAN', 'CONDUCTOR')")
  public Map<String, Object> removeCategory(
      @Valid @RequestBody RemoveCategoryRequestDTO requestDTO) {
    String rev = appSettingsService.removeCategory(requestDTO);
    return Map.of("rev", rev);
  }
}
