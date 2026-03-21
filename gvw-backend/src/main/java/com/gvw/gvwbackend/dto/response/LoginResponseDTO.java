package com.gvw.gvwbackend.dto.response;

import jakarta.validation.constraints.NotNull;

public record LoginResponseDTO(
    @NotNull String token, @NotNull boolean changePassword, @NotNull boolean firstLogin) {}
