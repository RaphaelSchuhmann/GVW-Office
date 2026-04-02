package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateScoreRequestDTO(
    @NotBlank String id,
    @NotBlank String scoreId,
    @NotBlank String title,
    @NotBlank String artist,
    @NotBlank String type,
    @NotBlank List<String> voices,
    @NotBlank @NotNull Integer voiceCount) {}
