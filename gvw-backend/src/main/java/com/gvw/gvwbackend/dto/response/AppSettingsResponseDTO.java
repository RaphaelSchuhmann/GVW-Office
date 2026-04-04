package com.gvw.gvwbackend.dto.response;

import java.util.Map;

public record AppSettingsResponseDTO(
    int maxMembers, Map<String, String> scoreCategories, String rev) {
  public AppSettingsResponseDTO {
    scoreCategories = scoreCategories == null ? Map.of() : Map.copyOf(scoreCategories);
  }
}
