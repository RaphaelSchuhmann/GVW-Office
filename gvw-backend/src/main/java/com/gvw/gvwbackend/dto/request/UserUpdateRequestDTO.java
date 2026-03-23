package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequestDTO(@NotBlank String email, @NotBlank String phone, @NotBlank String address) {}
