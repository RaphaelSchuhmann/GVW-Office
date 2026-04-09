package com.gvw.gvwbackend.dto.request;

import com.gvw.gvwbackend.model.Event;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record AddEventRequestDTO(
    @NotBlank String title,
    @NotBlank String type,
    @NotNull Instant date,
    @NotBlank String time,
    @NotBlank String location,
    String description,
    @NotBlank String status,
    @NotBlank String mode,
    Event.Recurrence recurrence) {}
