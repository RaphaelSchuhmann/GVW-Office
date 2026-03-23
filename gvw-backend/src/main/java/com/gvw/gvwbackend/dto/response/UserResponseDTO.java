package com.gvw.gvwbackend.dto.response;

import jakarta.validation.constraints.NotBlank;

public record UserResponseDTO(@NotBlank String email, @NotBlank String role, @NotBlank String name, @NotBlank String address, @NotBlank String phone) {}
