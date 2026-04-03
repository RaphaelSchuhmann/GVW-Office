package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddMemberRequestDTO(
    @NotBlank String name,
    @NotBlank String surname,
    @NotBlank @Email String email,
    @NotBlank String phone,
    @NotBlank String address,
    @NotBlank String voice,
    @NotBlank String status,
    @NotBlank String role,
    @NotBlank String birthdate,
    @NotBlank @Pattern(regexp = "\\d{4}", message = "joined must be in YYYY format")
        String joined) {}
