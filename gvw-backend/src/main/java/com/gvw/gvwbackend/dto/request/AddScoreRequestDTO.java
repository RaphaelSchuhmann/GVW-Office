package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record AddScoreRequestDTO(
        @NotBlank String scoreId,
        @NotBlank String title,
        @NotBlank String artist,
        @NotBlank String type,
        @NotBlank List<String> voices,
        @NotBlank String voiceCount
) {}
