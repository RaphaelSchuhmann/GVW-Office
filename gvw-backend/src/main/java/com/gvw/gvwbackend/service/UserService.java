package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddUserAdminRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateUserAdminRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateUserRequestDTO;
import com.gvw.gvwbackend.dto.response.UserManagerResponseDTO;
import com.gvw.gvwbackend.dto.response.UserManagerResponsesDTO;
import com.gvw.gvwbackend.dto.response.UserResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.mapper.UserMapper;
import com.gvw.gvwbackend.model.Member;
import com.gvw.gvwbackend.model.Role;
import com.gvw.gvwbackend.model.User;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class UserService {
  private final DbService dbService;
  private final PasswordEncoder passwordEncoder;
  private final MemberService memberService;
  private final MailService mailService;
  private final ObjectMapper mapper = new ObjectMapper();
  private final SseService sseService;
  private final UserMapper userMapper;
  private static final Logger log = LoggerFactory.getLogger(UserService.class);

  public UserService(
      DbService dbService,
      PasswordEncoder passwordEncoder,
      MemberService memberService,
      MailService mailService,
      SseService sseService,
      UserMapper userMapper) {
    this.dbService = dbService;
    this.passwordEncoder = passwordEncoder;
    this.memberService = memberService;
    this.mailService = mailService;
    this.sseService = sseService;
    this.userMapper = userMapper;
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

  public String resetPasswordUsingMemberId(String memberId) {
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

  public UserManagerResponsesDTO getUsers() {
    List<Map<String, Object>> usersRaw = dbService.findAll("users");

    List<User> users = usersRaw.stream().map(map -> mapper.convertValue(map, User.class)).toList();

    if (users.isEmpty()) {
      return new UserManagerResponsesDTO(List.of());
    }

    List<UserManagerResponseDTO> responseDTOS =
        users.stream()
            .map(
                m ->
                    new UserManagerResponseDTO(
                        m.getId(),
                        m.getRev(),
                        m.getName(),
                        m.getEmail(),
                        m.getRole().getValue(),
                        isOrphan(m.getMemberId())))
            .toList();

    return new UserManagerResponsesDTO(responseDTOS);
  }

  public void checkUser(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByUserId(id);
  }

  public void addUser(AddUserAdminRequestDTO request) {
    User user = createUserFromRequest(request);

    String temporaryPassword = AuthService.generatePassword(3, 2);

    user.setPassword(passwordEncoder.encode(temporaryPassword));

    dbService.insert("users", user);

    mailService.sendMail(
        user.getEmail(),
        "GVW-Office: Temporäres Password",
        "newUser",
        Map.of("tempPassword", temporaryPassword));

    try {
      sseService.broadcastRefresh("USER");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast USER refresh: ", ex);
    }
  }

  public String resetPasswordUsingUserId(String userId) {
    if (userId == null || userId.isEmpty()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByUserId(userId);

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

  public String updateUser(UpdateUserAdminRequestDTO request) {
    User user = getUserByUserId(request.id());

    if (!isOrphan(user.getMemberId())) {
      throw new BadRequestException("InvalidAction");
    }

    userMapper.updateUserFromDto(request, user);

    user.setRev(request.rev());

    Map<String, Object> userResult = dbService.update("users", user.getId(), user);

    try {
      sseService.broadcastRefresh("USER");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast USER refresh: ", ex);
    }

    if (userResult != null && userResult.containsKey("rev")) {
      return (String) userResult.get("rev");
    }

    throw new RuntimeException("FailedToRetrieveNewRevFromDB");
  }

  public void deleteUser(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    User user = getUserByUserId(id);

    if (!isOrphan(user.getMemberId())) {
      throw new BadRequestException("InvalidAction");
    }

    dbService.delete("users", user.getId(), user.getRev());

    try {
      sseService.broadcastRefresh("USER");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast USER refresh: ", ex);
    }
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

  public String resolveUserIdToEmail(String id) {
    if (id == null || id.isBlank()) {
      return "";
    }

    List<User> users =
        dbService.findByQuery(
            "users", Map.of("selector", Map.of("userId", id), "limit", 1), User.class);
    if (users == null || users.isEmpty()) {
      return "";
    }

    String email = users.getFirst().getEmail();
    return email == null ? "" : email;
  }

  private boolean isOrphan(String memberId) {
    if (memberId == null || memberId.isBlank()) return true;

    Map<String, Object> query = Map.of("selector", Map.of("_id", memberId));
    List<Member> members = dbService.findByQuery("members", query, Member.class);

    return members == null || members.isEmpty();
  }

  private User createUserFromRequest(AddUserAdminRequestDTO request) {
    User user = new User();
    user.setEmail(request.email());
    user.setName(request.name());
    user.setPhone(request.phone());
    user.setAddress(request.address());
    user.setChangePassword(true);
    user.setFirstLogin(true);
    user.setUserId(UUID.randomUUID().toString());
    user.setRole(Role.fromString(request.role()));
    user.setFailedLoginAttempts(0);
    user.setLockUntil(null);

    return user;
  }
}
