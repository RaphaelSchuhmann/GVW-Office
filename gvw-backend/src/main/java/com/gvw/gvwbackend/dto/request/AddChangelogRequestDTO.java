package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record AddChangelogRequestDTO(
    @NotBlank String version,
    @NotBlank String title,
    @NotBlank String content,
    @NotBlank Instant timestamp) {}
