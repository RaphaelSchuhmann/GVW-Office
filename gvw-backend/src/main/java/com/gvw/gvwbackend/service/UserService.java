package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.UpdateUserRequestDTO;
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
      DbService dbService,
      PasswordEncoder passwordEncoder,
      MemberService memberService,
      MailService mailService) {
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
        user.getPhone(),
        user.getRev());
  }

  public List<String> updateUser(String userId, UpdateUserRequestDTO requestDTO) {
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

    Map<String, Object> respUser = dbService.update("users", user.getId(), user);

    if (respUser == null || !respUser.containsKey("rev")) {
      throw new RuntimeException("FailedToRetrieveNewRevsFromDB");
    }

    member.setEmail(requestDTO.email());
    member.setPhone(requestDTO.phone());
    member.setAddress(requestDTO.address());

    Map<String, Object> respMember = dbService.update("members", member.getId(), member);

    if (respMember == null || !respMember.containsKey("rev")) {
      throw new RuntimeException("FailedToRetrieveNewRevsFromDB");
    }

    return List.of((String) respMember.get("rev"), (String) respUser.get("rev"));
  }

  public String resetPassword(String memberId) {
    if (memberId == null || memberId.isEmpty()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByMemberId(memberId);

    String temporaryPassword = AuthService.generatePassword(3, 2);

    user.setPassword(passwordEncoder.encode(temporaryPassword));
    user.setChangePassword(true);
    Map<String, Object> resp = dbService.update("users", user.getId(), user);

    if (resp == null || !resp.containsKey("rev")) {
      throw new RuntimeException("FailedToRetrieveNewRevsFromDB");
    }

    mailService.sendMail(
        user.getEmail(),
        "GVW-Office: Passwort zurückgesetzt",
        "resetPassword",
        Map.of("tempPassword", temporaryPassword));

    return (String) resp.get("rev");
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
