package com.gvw.gvwbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppSettings {
  @JsonProperty("_id")
  private String id;

  @JsonProperty("_rev")
  private String rev;

  private int maxMembers;
  private Map<String, String> scoreCategories;

  @Builder.Default private final String type = "appSettings";
}
