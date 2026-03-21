package com.gvw.gvwbackend.exception;

import lombok.Getter;

@Getter
public class TooManyRequestsException extends AppException {
  private final long retryAfterSeconds;

  public TooManyRequestsException(String message, long retryAfterSeconds) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
