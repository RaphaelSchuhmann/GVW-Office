package com.gvw.gvwbackend.exception.handler;

import com.gvw.gvwbackend.dto.response.ErrorResponseDTO;
import com.gvw.gvwbackend.exception.*;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpStatusCodeException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(DatabaseConnectionException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponseDTO handleDatabaseConnection(DatabaseConnectionException ex) {
    return new ErrorResponseDTO("Database connection failed", null);
  }

  @ExceptionHandler(DatabaseMappingException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponseDTO handleDatabaseMapping(DatabaseMappingException ex) {
    return new ErrorResponseDTO("Data could not be retrieved from database", null);
  }

  @ExceptionHandler(BadRequestException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ErrorResponseDTO handleBadRequest(BadRequestException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ErrorResponseDTO handleBadRequestFromValidation(MethodArgumentNotValidException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public ErrorResponseDTO handleInvalidCredentials(InvalidCredentialsException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(NotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ErrorResponseDTO handleNotFound(NotFoundException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(HttpStatusCodeException.class)
  public ResponseEntity<ErrorResponseDTO> handleNotFoundFromDB(HttpStatusCodeException ex) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(new ErrorResponseDTO(ex.getMessage(), null));
  }

  @ExceptionHandler(ConflictException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public ErrorResponseDTO handleConflict(ConflictException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(TooManyRequestsException.class)
  @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
  public ErrorResponseDTO handleTooManyRequests(TooManyRequestsException ex) {
    return new ErrorResponseDTO(ex.getMessage(), Map.of("retryAfter", ex.getRetryAfterSeconds()));
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponseDTO handleGeneric(Exception ex) {
    return new ErrorResponseDTO("Internal Server Error", null);
  }
}
