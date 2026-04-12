package com.gvw.gvwbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportMetaData {
  private String userId;
  private String route;
  private String appVersion;
  private LocalDateTime timestamp;
  private String os;
  private String browser;
  private String viewport;

  @Builder.Default private final String type = "reportMetaData";
}
