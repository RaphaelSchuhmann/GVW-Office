package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.ChangePwRequestDTO;
import com.gvw.gvwbackend.dto.request.LoginRequestDTO;
import com.gvw.gvwbackend.dto.response.LoginResponseDTO;
import com.gvw.gvwbackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO loginRequest) {
    return authService.login(loginRequest);
  }

  @PostMapping("/changePw")
  @ResponseStatus(HttpStatus.OK)
  public void changePw(@Valid @RequestBody ChangePwRequestDTO changePwRequest) {
    authService.changePassword(changePwRequest);
  }
}
