package com.gvw.gvwbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugReport {
  @JsonProperty("_id")
  private String id;

  @JsonProperty("_rev")
  private String rev;

  private String title;
  private String severity;
  private String stepsToReproduce;
  private ReportMetaData metaData;

  @Builder.Default
  @JsonProperty("doc_type")
  private final String docType = "bugReport";
}
