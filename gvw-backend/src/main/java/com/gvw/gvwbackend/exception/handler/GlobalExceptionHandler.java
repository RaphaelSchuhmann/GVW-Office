package com.gvw.gvwbackend.exception.handler;

import com.gvw.gvwbackend.exception.DatabaseConnectionException;
import com.gvw.gvwbackend.exception.DatabaseMappingException;
import com.gvw.gvwbackend.exception.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(DatabaseConnectionException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponse handleDatabaseConnection(DatabaseConnectionException ex) {
    return new ErrorResponse("Database connection failed");
  }

  @ExceptionHandler(DatabaseMappingException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponse handleDatabaseMapping(DatabaseMappingException ex) {
    return new ErrorResponse("Data could not be retrieved from database");
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponse handleGeneric(Exception ex) {
    return new ErrorResponse("Internal Server Error");
  }
}
