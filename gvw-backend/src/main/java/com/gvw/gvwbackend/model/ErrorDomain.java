package com.gvw.gvwbackend.model;

public enum ErrorDomain {
  AUTH(10),
  APP_SETTINGS(20),
  USER(30),
  DASHBOARD(40), // Technically not needed, but still added for future
  MEMBER(50),
  EVENTS(60),
  REPORT(70),
  LIBRARY(80),
  FEEDBACK(90),
  BUG_REPORT(11),
  CHANGELOG(12),
  FILE_VALIDATOR(13), // Technically not needed as its id is hard coded in the responses for invalid files
  TEXT_EDITOR(14);

  private final int id;

  ErrorDomain(int id) {
    this.id = id;
  }

  public int createCode(int method, int httpStatus) {
    String formattedCode = String.format("%02d%02d%03d", this.id, method, httpStatus);
    return Integer.parseInt(formattedCode);
  }
}
