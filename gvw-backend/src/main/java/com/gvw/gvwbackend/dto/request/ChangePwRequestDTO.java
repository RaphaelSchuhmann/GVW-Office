package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotNull;

public record ChangePwRequestDTO(
    @NotNull String email, @NotNull String oldPassword, @NotNull String newPassword) {}
