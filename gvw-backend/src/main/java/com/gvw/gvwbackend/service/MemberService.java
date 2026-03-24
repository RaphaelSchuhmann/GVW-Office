package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.response.MemberResponseDTO;
import com.gvw.gvwbackend.dto.response.MembersResponseDTO;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.model.Member;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class MemberService {
  private final DbService dbService;
  private final ObjectMapper mapper = new ObjectMapper();

  public MemberService(DbService dbService) {
    this.dbService = dbService;
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
                        m.getRole(),
                        m.getBirthdate(),
                        m.getJoined()))
            .toList();

    return new MembersResponseDTO(responseMembers);
  }



  public Member getMemberById(String id) {
    Member member = dbService.findById("members", id, Member.class);

    if (member == null) throw new NotFoundException("MemberNotFound");

    return member;
  }
}
