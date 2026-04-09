package com.gvw.gvwbackend.dto.request;

import com.gvw.gvwbackend.model.Event;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddEventRequestDTO(
    @NotBlank String title,
    @NotBlank String type,

    @Pattern(
            regexp = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$",
            message = "Date must be a valid ISO-8601 UTC string (e.g., 2026-04-09T00:00:00.000Z)"
    )
    @NotBlank String date,

    @NotBlank String time,
    @NotBlank String location,
    String description,
    @NotBlank String status,
    @NotBlank String mode,
    Event.Recurrence recurrence) {}
