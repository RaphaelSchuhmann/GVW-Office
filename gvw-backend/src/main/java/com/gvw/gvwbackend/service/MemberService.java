package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddMemberRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMemberRequestDTO;
import com.gvw.gvwbackend.dto.response.MemberResponseDTO;
import com.gvw.gvwbackend.dto.response.MembersResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.mapper.MemberMapper;
import com.gvw.gvwbackend.model.ErrorDomain;
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
public class MemberService {
  private final DbService dbService;
  private final ObjectMapper mapper = new ObjectMapper();
  private final MemberMapper memberMapper;
  private final PasswordEncoder passwordEncoder;
  private final MailService mailService;
  private final SseService sseService;
  private static final Logger log = LoggerFactory.getLogger(MemberService.class);

  public MemberService(
      DbService dbService,
      MemberMapper memberMapper,
      PasswordEncoder passwordEncoder,
      MailService mailService,
      SseService sseService) {
    this.dbService = dbService;
    this.memberMapper = memberMapper;
    this.passwordEncoder = passwordEncoder;
    this.mailService = mailService;
    this.sseService = sseService;
  }

  // METHOD ID: 01
  public MembersResponseDTO getMembers() {
    List<Map<String, Object>> membersRaw = dbService.findAll("members");

    List<Member> members =
        membersRaw.stream().map(map -> mapper.convertValue(map, Member.class)).toList();

    if (members.isEmpty()) {
      return new MembersResponseDTO(List.of());
    }

    List<MemberResponseDTO> responseMembers =
        members.stream()
            .map(
                m ->
                    new MemberResponseDTO(
                        m.getId(),
                        m.getRev(),
                        m.getName(),
                        m.getSurname(),
                        m.getEmail(),
                        m.getPhone(),
                        m.getAddress(),
                        m.getVoice(),
                        m.getStatus(),
                        m.getRole().getValue(),
                        m.getBirthdate(),
                        m.getJoined()))
            .toList();

    return new MembersResponseDTO(responseMembers);
  }

  // METHOD ID: 02
  public void checkMember(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException(String.valueOf(ErrorDomain.MEMBER.createCode(2, 400)));
    }

    Member member = dbService.findById("members", id, Member.class);
    if (member == null) {
      throw new NotFoundException(String.valueOf(ErrorDomain.MEMBER.createCode(2, 404)));
    }
  }

  // METHOD ID: 03
  public void addMember(AddMemberRequestDTO request) {
    if (emailExists(request.email())) {
      throw new ConflictException(String.valueOf(ErrorDomain.MEMBER.createCode(3, 409)));
    }

    Member member = createMemberFromRequest(request);
    User user = createUserFromRequest(request);

    try {
      dbService.insert("members", member);

      Map<String, Object> query = Map.of("selector", Map.of("email", request.email()), "limit", 1);
      List<Member> members = dbService.findByQuery("members", query, Member.class);

      if (members.isEmpty()) {
        throw new NotFoundException(String.valueOf(ErrorDomain.MEMBER.createCode(3, 404)));
      }

      String temporaryPassword = AuthService.generatePassword(3, 2);

      Member savedMember = members.getFirst();
      user.setMemberId(savedMember.getId());
      user.setPassword(passwordEncoder.encode(temporaryPassword));

      dbService.insert("users", user);

      mailService.sendMail(
          user.getEmail(),
          "GVW-Office: Temporäres Password",
          "newUser",
          Map.of("tempPassword", temporaryPassword));

      try {
        sseService.broadcastRefresh("MEMBERS");
      } catch (RuntimeException ex) {
        log.warn("Failed to broadcast MEMBERS refresh: ", ex);
      }
    } catch (Exception e) {
      log.error("Sync error during member/user creations: {}", e.getMessage());

      // Rollback
      try {
        Map<String, Object> rollbackQuery =
            Map.of("selector", Map.of("email", request.email()), "limit", 1);
        List<Member> toDeleteList = dbService.findByQuery("members", rollbackQuery, Member.class);

        if (!toDeleteList.isEmpty()) {
          Member orphan = toDeleteList.getFirst();

          dbService.delete("members", orphan.getId(), orphan.getRev());
          log.info("Rollback: Successfully deleted orphan member {}", orphan.getId());
        }
      } catch (Exception rollbackException) {
        log.error(
            "CRITICAL: Manual intervention required. Could not delete orphan member for email: {}",
            request.email());
      }

      throw new RuntimeException(String.valueOf(ErrorDomain.MEMBER.createCode(3, 500)), e);
    }
  }

  // METHOD ID: 04
  public void deleteMember(String id) {
    if (id == null || id.isEmpty()) {
      throw new BadRequestException(String.valueOf(ErrorDomain.MEMBER.createCode(4, 400)));
    }

    Member member = getMemberById(id);
    User user = getUserByMemberId(id);

    dbService.delete("members", member.getId(), member.getRev());
    dbService.delete("users", user.getId(), user.getRev());

    sseService.broadcastRefresh("MEMBERS");
  }

  // METHOD ID: 05
  public List<String> updateMember(UpdateMemberRequestDTO request) {
    // Can throw not found
    Member member = getMemberById(request.id());
    User user = getUserByMemberId(request.id());

    memberMapper.updateMemberFromDto(request, member);
    memberMapper.updateUserFromDto(request, user);

    member.setRev(request.rev());

    Map<String, Object> userResult = dbService.update("users", user.getId(), user);
    Map<String, Object> memberResult = dbService.update("members", member.getId(), member);

    try {
      sseService.broadcastRefresh("MEMBERS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast MEMBERS refresh: ", ex);
    }

    if (memberResult != null
        && memberResult.containsKey("rev")
        && userResult != null
        && userResult.containsKey("rev")) {
      return List.of((String) memberResult.get("rev"), (String) userResult.get("rev"));
    }

    throw new RuntimeException(String.valueOf(ErrorDomain.MEMBER.createCode(5, 500)));
  }

  // METHOD ID: 06
  public String updateMemberStatus(String id, String _rev) {
    if (id == null || id.isEmpty()) {
      throw new BadRequestException(String.valueOf(ErrorDomain.MEMBER.createCode(6, 400)));
    }

    Member member = getMemberById(id);

    member.setRev(_rev);
    member.setStatus("active".equals(member.getStatus()) ? "inactive" : "active");

    Map<String, Object> memberResult = dbService.update("members", member.getId(), member);

    try {
      sseService.broadcastRefresh("MEMBERS");
    } catch (RuntimeException ex) {
      log.warn("Failed to broadcast MEMBERS refresh: ", ex);
    }

    if (memberResult != null && memberResult.containsKey("rev")) {
      return (String) memberResult.get("rev");
    }

    throw new RuntimeException(String.valueOf(ErrorDomain.MEMBER.createCode(6, 500)));
  }

  // METHOD ID: 07
  private boolean emailExists(String email) {
    Map<String, Object> query = Map.of("selector", Map.of("email", email), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    return !users.isEmpty();
  }

  // METHOD ID: 08
  private User createUserFromRequest(AddMemberRequestDTO request) {
    User user = new User();
    user.setEmail(request.email());
    user.setName(request.name() + " " + request.surname());
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

  // METHOD ID: 09
  private Member createMemberFromRequest(AddMemberRequestDTO request) {
    Member member = new Member();
    member.setName(request.name());
    member.setSurname(request.surname());
    member.setEmail(request.email());
    member.setPhone(request.phone());
    member.setAddress(request.address());
    member.setVoice(request.voice());
    member.setRole(Role.fromString(request.role()));
    member.setStatus(request.status());
    member.setBirthdate(request.birthdate());
    member.setJoined(request.joined());

    return member;
  }

  // METHOD ID: 10
  public Member getMemberById(String id) {
    Member member = dbService.findById("members", id, Member.class);

    if (member == null)
      throw new NotFoundException(String.valueOf(ErrorDomain.MEMBER.createCode(10, 404)));

    return member;
  }

  // METHOD ID: 11
  private User getUserByMemberId(String memberId) {
    Map<String, Object> query = Map.of("selector", Map.of("memberId", memberId), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users == null || users.isEmpty())
      throw new NotFoundException(String.valueOf(ErrorDomain.MEMBER.createCode(11, 404)));

    return users.getFirst();
  }
}
