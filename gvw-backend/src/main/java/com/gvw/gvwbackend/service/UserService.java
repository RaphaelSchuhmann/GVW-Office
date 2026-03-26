package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.UserUpdateRequestDTO;
import com.gvw.gvwbackend.dto.response.UserResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.Member;
import com.gvw.gvwbackend.model.User;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final DbService dbService;
  private final PasswordEncoder passwordEncoder;
  private final MemberService memberService;
  private final MailService mailService;

  public UserService(
      DbService dbService, PasswordEncoder passwordEncoder, MemberService memberService, MailService mailService) {
    this.dbService = dbService;
    this.passwordEncoder = passwordEncoder;
    this.memberService = memberService;
    this.mailService = mailService;
  }

  public UserResponseDTO getUser(String userId) {
    if (userId == null || userId.isEmpty()) {
      throw new InvalidCredentialsException("Unauthorized");
    }

    User user = getUserByUserId(userId);

    return new UserResponseDTO(
        user.getEmail(),
        user.getRole().getValue(),
        user.getName(),
        user.getAddress(),
        user.getPhone());
  }

  public void updateUser(String userId, UserUpdateRequestDTO requestDTO) {
    if (userId == null || userId.isEmpty()) {
      throw new InvalidCredentialsException("Unauthorized");
    }

    if (requestDTO == null
        || requestDTO.email() == null
        || requestDTO.email().isBlank()
        || requestDTO.phone() == null
        || requestDTO.phone().isBlank()
        || requestDTO.address() == null
        || requestDTO.address().isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByUserId(userId);
    Member member = memberService.getMemberById(user.getMemberId());

    user.setEmail(requestDTO.email());
    user.setPhone(requestDTO.phone());
    user.setAddress(requestDTO.address());

    dbService.update("users", user);

    member.setEmail(requestDTO.email());
    member.setPhone(requestDTO.phone());
    member.setAddress(requestDTO.address());

    dbService.update("members", member);
  }

  public void resetPassword(String memberId) {
    if (memberId == null || memberId.isEmpty()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByMemberId(memberId);

    String temporaryPassword = AuthService.generatePassword(3, 2);

    user.setPassword(passwordEncoder.encode(temporaryPassword));
    user.setChangePassword(true);
    dbService.update("users", user);

    mailService.sendMail(user.getEmail(), "GVW-Office: Passwort zurückgesetzt", "resetPassword", Map.of("tempPassword", temporaryPassword));
  }

  private User getUserByMemberId(String memberId) {
    Map<String, Object> query = Map.of("selector", Map.of("memberId", memberId), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users == null || users.isEmpty()) throw new NotFoundException("UserNotFound");

    return users.getFirst();
  }

  private User getUserByUserId(String userId) {
    Map<String, Object> query = Map.of("selector", Map.of("userId", userId), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users == null || users.isEmpty()) throw new NotFoundException("UserNotFound");

    return users.getFirst();
  }
}
