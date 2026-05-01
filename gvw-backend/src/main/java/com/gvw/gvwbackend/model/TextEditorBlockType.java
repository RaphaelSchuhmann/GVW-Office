package com.gvw.gvwbackend.model;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum TextEditorBlockType {
  TEXT("text"),
  IMAGE("image"),
  FILE("file"),
  BLOCKQUOTE("blockquote"),
  HEADING_T1("headingT1"),
  HEADING_T2("headingT2"),
  HEADING_T3("headingT3");

  private final String value;

  TextEditorBlockType(String value) {
    this.value = value;
  }

  @JsonCreator
  public static TextEditorBlockType fromString(String s) {
    if (s == null) return TEXT;
    return Arrays.stream(values())
        .filter(r -> r.value.equalsIgnoreCase(s))
        .findFirst()
        .orElse(TEXT);
  }

  @JsonValue
  public String toJson() {
    return value;
  }
}
