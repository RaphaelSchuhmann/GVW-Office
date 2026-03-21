package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.LoginRequestDTO;
import com.gvw.gvwbackend.dto.response.LoginResponseDTO;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.exception.TooManyRequestsException;
import com.gvw.gvwbackend.model.User;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final DbService dbService;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(DbService dbService, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.dbService = dbService;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public LoginResponseDTO login(LoginRequestDTO requestDTO) {
    Map<String, Object> query = Map.of("selector", Map.of("email", requestDTO.email()), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users.isEmpty()) throw new InvalidCredentialsException("UserNotFound");

    User user = users.getFirst();
    Instant now = Instant.now();

    if (user.getLockUntil() != null && now.isBefore(user.getLockUntil())) {
      throw new TooManyRequestsException("AccountLocked", user.getLockUntil().toEpochMilli());
    }

    if (!passwordEncoder.matches(requestDTO.password(), user.getPassword())) {
      if (user.getFailedLoginAttempts() > 4) {
        user.setLockUntil(Instant.now().plus(Duration.ofMinutes(15)));
        dbService.update("users", user);
        throw new TooManyRequestsException("AccountLocked", user.getLockUntil().toEpochMilli());
      } else {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        dbService.update("users", user);
        throw new InvalidCredentialsException("InvalidPassword");
      }
    } else {
      user.setFailedLoginAttempts(0);
      user.setLockUntil(null);
      dbService.update("users", user);
    }

    String token = jwtService.generateToken(user.getUserId(), null);

    return new LoginResponseDTO(token, user.getChangePassword(), user.getFirstLogin());
  }
}
