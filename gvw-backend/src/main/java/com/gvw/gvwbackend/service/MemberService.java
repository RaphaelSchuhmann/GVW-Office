package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddMemberRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMemberRequestDTO;
import com.gvw.gvwbackend.dto.response.MemberResponseDTO;
import com.gvw.gvwbackend.dto.response.MembersResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.ConflictException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.mapper.MemberMapper;
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

  public void addMember(AddMemberRequestDTO request) {
    if (emailExists(request.email())) {
      throw new ConflictException("EmailAlreadyInUse");
    }

    Member member = createMemberFromRequest(request);
    User user = createUserFromRequest(request);

    try {
      dbService.insert("members", member);

      Map<String, Object> query = Map.of("selector", Map.of("email", request.email()), "limit", 1);
      List<Member> members = dbService.findByQuery("members", query, Member.class);

      if (members.isEmpty()) {
        throw new NotFoundException("MemberNotFound");
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

      sseService.broadcastRefresh("MEMBERS");
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

      throw new RuntimeException("RegistrationFailed", e);
    }
  }

  public void deleteMember(String id) {
    if (id == null || id.isEmpty()) {
      throw new BadRequestException("InvalidData");
    }

    Member member = getMemberById(id);
    User user = getUserByMemberId(id);

    dbService.delete("members", member.getId(), member.getRev());
    dbService.delete("users", user.getId(), user.getRev());

    sseService.broadcastRefresh("MEMBERS");
  }

  public void updateMember(UpdateMemberRequestDTO request) {
    Member member = getMemberById(request.id());
    User user = getUserByMemberId(request.id());

    memberMapper.updateMemberFromDto(request, member);
    memberMapper.updateUserFromDto(request, user);

    dbService.update("members", member);
    dbService.update("users", user);

    sseService.broadcastRefresh("MEMBERS");
  }

  public void updateMemberStatus(String id) {
    if (id == null || id.isEmpty()) {
      throw new BadRequestException("InvalidData");
    }

    Member member = getMemberById(id);

    member.setStatus("active".equals(member.getStatus()) ? "inactive" : "active");

    dbService.update("members", member);

    sseService.broadcastRefresh("MEMBERS");
  }

  private boolean emailExists(String email) {
    Map<String, Object> query = Map.of("selector", Map.of("email", email), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    return !users.isEmpty();
  }

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

  public Member getMemberById(String id) {
    Member member = dbService.findById("members", id, Member.class);

    if (member == null) throw new NotFoundException("MemberNotFound");

    return member;
  }

  private User getUserByMemberId(String memberId) {
    Map<String, Object> query = Map.of("selector", Map.of("memberId", memberId), "limit", 1);
    List<User> users = dbService.findByQuery("users", query, User.class);

    if (users == null || users.isEmpty()) throw new NotFoundException("UserNotFound");

    return users.getFirst();
  }
}
