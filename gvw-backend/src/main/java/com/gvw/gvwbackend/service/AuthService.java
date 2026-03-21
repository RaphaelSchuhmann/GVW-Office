package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.ChangePwRequestDTO;
import com.gvw.gvwbackend.dto.request.LoginRequestDTO;
import com.gvw.gvwbackend.dto.response.LoginResponseDTO;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.exception.TooManyRequestsException;
import com.gvw.gvwbackend.model.User;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final DbService dbService;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private static final List<String> words =
      List.of(
          "apple",
          "banana",
          "chorus",
          "melody",
          "note",
          "voice",
          "sing",
          "harmony",
          "music",
          "choir",
          "pineapple",
          "gvw");

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
      int failedAttempts = Optional.ofNullable(user.getFailedLoginAttempts()).orElse(0);
      if (failedAttempts > 4) {
        user.setLockUntil(Instant.now().plus(Duration.ofMinutes(15)));
        dbService.update("users", user);
        throw new TooManyRequestsException("AccountLocked", user.getLockUntil().toEpochMilli());
      } else {
        user.setFailedLoginAttempts(failedAttempts + 1);
        dbService.update("users", user);
        throw new InvalidCredentialsException("InvalidPassword");
      }
    } else {
      user.setFailedLoginAttempts(0);
      user.setLockUntil(null);
      dbService.update("users", user);
    }

    String token = jwtService.generateToken(user.getUserId(), null);

    return new LoginResponseDTO(token, Boolean.TRUE.equals(user.getChangePassword()), Boolean.TRUE.equals(user.getFirstLogin()));
  }

  public void changePassword(ChangePwRequestDTO requestDTO) {
    Map<String, Object> query = Map.of("selector", Map.of("email", requestDTO.email()), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users.isEmpty()) throw new InvalidCredentialsException("UserNotFound");

    User user = users.getFirst();

    // Ensure new password is not the same as old password
    if (passwordEncoder.matches(requestDTO.newPassword(), user.getPassword())) {
      throw new ConflictException("SamePasswordAsOld");
    }

    // Authenticate user
    if (!passwordEncoder.matches(requestDTO.oldPassword(), user.getPassword())) {
      throw new InvalidCredentialsException("InvalidPassword");
    }

    String hashedPassword = passwordEncoder.encode(requestDTO.newPassword());
    user.setPassword(hashedPassword);
    user.setChangePassword(false);
    user.setFirstLogin(false);

    dbService.update("users", user);
  }

  public static String generatePassword(int wordCount, int numberCount) {
    java.security.SecureRandom random = new java.security.SecureRandom();

    List<String> chosenWords = new ArrayList<>();
    for (int i = 0; i < wordCount; i++) {
      String word = words.get(random.nextInt(words.size()));
      String capitalizedWord = word.substring(0, 1).toUpperCase() + word.substring(1);
      chosenWords.add(capitalizedWord);
    }

    List<String> digits = new ArrayList<>();
    for (int i = 0; i < numberCount; i++) {
      digits.add(Integer.toString(random.nextInt(10)));
    }

    List<String> combined = new ArrayList<>();
    combined.addAll(chosenWords);
    combined.addAll(digits);

    Collections.shuffle(combined, random);

    StringBuilder result = new StringBuilder();
    for (String s : combined) {
      result.append(s);
    }

    return result.toString();
  }
}
