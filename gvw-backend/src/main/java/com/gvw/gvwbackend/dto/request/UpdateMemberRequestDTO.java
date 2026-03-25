package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRequestDTO(
    @NotBlank String id,
    @NotBlank String name,
    @NotBlank String surname,
    @NotBlank @Email String email,
    @NotBlank String phone,
    @NotBlank String address,
    @NotBlank String voice,
    @NotBlank String status,
    @NotBlank String role,
    @NotBlank String birthdate,
    @NotBlank String joined) {}
