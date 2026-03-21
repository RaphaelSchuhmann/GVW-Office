package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.ChangePwRequestDTO;
import com.gvw.gvwbackend.dto.request.LoginRequestDTO;
import com.gvw.gvwbackend.dto.response.LoginResponseDTO;
import com.gvw.gvwbackend.service.AuthService;
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
  public LoginResponseDTO login(@RequestBody LoginRequestDTO loginRequest) {
    System.out.println("HERE");
    return authService.login(loginRequest);
  }

  @PostMapping("/changePw")
  @ResponseStatus(HttpStatus.OK)
  public void changePw(@RequestBody ChangePwRequestDTO changePwRequest) {
    authService.changePassword(changePwRequest);
  }
}
