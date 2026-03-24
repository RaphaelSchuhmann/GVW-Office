package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddMemberRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateMemberRequestDTO;
import com.gvw.gvwbackend.dto.response.MembersResponseDTO;
import com.gvw.gvwbackend.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/members")
public class MemberController {
  private final MemberService memberService;

  public MemberController(MemberService memberService) {
    this.memberService = memberService;
  }

  @GetMapping("/all")
  public MembersResponseDTO getAllMembers() {
    return memberService.getMembers();
  }

  @PostMapping("/add")
  @ResponseStatus(HttpStatus.OK)
  public void addMember(@Valid @RequestBody AddMemberRequestDTO requestDTO) {
    memberService.addMember(requestDTO);
  }

  @DeleteMapping("/delete/{id}")
  @ResponseStatus(HttpStatus.OK)
  public void deleteMember(@PathVariable String id) {
    memberService.deleteMember(id);
  }

  @PatchMapping("/update")
  @ResponseStatus(HttpStatus.OK)
  public void updateMember(@Valid @RequestBody UpdateMemberRequestDTO requestDTO) {
    memberService.updateMember(requestDTO);
  }

  @PatchMapping("/update/status/{id}")
  @ResponseStatus(HttpStatus.OK)
  public void updateMemberStatus(@PathVariable String id) {
    memberService.updateMemberStatus(id);
  }
}
