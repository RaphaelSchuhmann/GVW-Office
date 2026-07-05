package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddHelpCenterArticleRequestDTO;
import com.gvw.gvwbackend.dto.request.AddHelpCenterCategoryRequestDTO;
import com.gvw.gvwbackend.dto.request.SetFeaturedHelpCenterCategoriesRequestDTO;
import com.gvw.gvwbackend.dto.response.ArticlesResponseDTO;
import com.gvw.gvwbackend.exception.ErrorAction;
import com.gvw.gvwbackend.exception.ErrorDomain;
import com.gvw.gvwbackend.exception.ErrorResource;
import com.gvw.gvwbackend.exception.handler.ErrorContext;
import com.gvw.gvwbackend.service.AppSettingsService;
import com.gvw.gvwbackend.service.HelpCenterService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/help")
public class HelpCenterController {
  private final AppSettingsService appSettingsService;
  private final HelpCenterService helpCenterService;

  public HelpCenterController(
      AppSettingsService appSettingsService, HelpCenterService helpCenterService) {
    this.appSettingsService = appSettingsService;
    this.helpCenterService = helpCenterService;
  }

  @PostMapping("/category/add")
  @ErrorContext(
      domain = ErrorDomain.HELP_CENTER,
      action = ErrorAction.CREATE,
      resource = ErrorResource.HELP_CENTER_CATEGORY)
  @ResponseStatus(HttpStatus.OK)
  public Map<String, String> addCategory(
      @Valid @RequestBody AddHelpCenterCategoryRequestDTO request) {
    String rev = appSettingsService.addHelpCenterCategoryToSettings(request);
    return Map.of("rev", rev);
  }

  @DeleteMapping("/category/delete/{id}")
  @ResponseStatus(HttpStatus.OK)
  public Map<String, String> removeCategory(@PathVariable String id) {
    String rev = helpCenterService.removeHelpCenterCategory(id);
    return Map.of("rev", rev);
  }

  @PatchMapping("/category/update/featured")
  @ErrorContext(
      domain = ErrorDomain.HELP_CENTER,
      action = ErrorAction.UPDATE,
      resource = ErrorResource.HELP_CENTER_CATEGORY)
  @ResponseStatus(HttpStatus.OK)
  public Map<String, String> featureCategories(
      @Valid @RequestBody SetFeaturedHelpCenterCategoriesRequestDTO request) {
    String rev = appSettingsService.updateFeaturedHelpCenterCategories(request);
    return Map.of("rev", rev);
  }

  @PostMapping("/article/add")
  @ErrorContext(
      domain = ErrorDomain.HELP_CENTER,
      action = ErrorAction.CREATE,
      resource = ErrorResource.HELP_CENTER_ARTICLE)
  @ResponseStatus(HttpStatus.OK)
  public void addArticle(@Valid @RequestBody AddHelpCenterArticleRequestDTO request) {
    helpCenterService.createArticle(request);
  }

  @GetMapping("/article/get")
  public ArticlesResponseDTO getArticlesOfCategory(@RequestParam("category") String category) {
    return helpCenterService.getArticles(category);
  }
}
