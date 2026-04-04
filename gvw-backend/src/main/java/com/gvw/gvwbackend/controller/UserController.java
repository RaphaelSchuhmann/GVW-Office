package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.UpdateUserRequestDTO;
import com.gvw.gvwbackend.dto.response.UserResponseDTO;
import com.gvw.gvwbackend.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/data")
  public UserResponseDTO getUser(@RequestAttribute("userId") String userId) {
    return userService.getUser(userId);
  }

  @PostMapping("/reset/password/{id}")
  @ResponseStatus(HttpStatus.OK)
  @PreAuthorize("hasAnyRole('ADMIN', 'BOARD_MEMBER')")
  public Map<String, Object> resetPassword(@PathVariable String id) {
    String rev = userService.resetPassword(id);
    return Map.of("rev", rev);
  }
}
