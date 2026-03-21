package com.gvw.gvwbackend.exception;

import jakarta.validation.constraints.NotNull;

public class ErrorResponse {
  private String message;

  public ErrorResponse(@NotNull String message) {
    this.message = message;
  }

  public String getMessage() {
    return message;
  }
}
