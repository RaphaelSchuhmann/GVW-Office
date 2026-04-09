package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

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
        @NotNull Instant birthdate,
        @NotNull Instant joined,
        @NotBlank String rev) {}
