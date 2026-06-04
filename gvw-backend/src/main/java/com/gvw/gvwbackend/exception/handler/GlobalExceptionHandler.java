package com.gvw.gvwbackend.exception.handler;

import com.gvw.gvwbackend.dto.response.ErrorResponseDTO;
import com.gvw.gvwbackend.exception.*;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.HandlerMethod;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(DatabaseConnectionException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponseDTO handleDatabaseConnection(DatabaseConnectionException ex) {
    return new ErrorResponseDTO("0000500", null);
  }

  @ExceptionHandler(DatabaseMappingException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponseDTO handleDatabaseMapping(DatabaseMappingException ex) {
    return new ErrorResponseDTO("0000500", null);
  }

  @ExceptionHandler(BadRequestException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ErrorResponseDTO handleBadRequest(BadRequestException ex) {
    return new ErrorResponseDTO(ex.getMessage(), null);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ErrorResponseDTO handleBadRequestFromValidation(MethodArgumentNotValidException ex) {
    int domain = 0;
    int method = 0;

    java.lang.reflect.Method executable = (java.lang.reflect.Method) ex.getParameter().getExecutable();

    ErrorContext context = executable.getAnnotation(ErrorContext.class);

    if (context == null) {
      context = executable.getDeclaringClass().getAnnotation(ErrorContext.class);
    }

    if (context != null) {
      domain = context.domain();
      method = context.method();
    }

    String formattedCode = String.format("%02d%02d%03d", domain, method, 400);
    return new ErrorResponseDTO(formattedCode, null);
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
    return new ErrorResponseDTO("0000500", null);
  }
}
