package com.gvw.gvwbackend.dto.request;

import com.gvw.gvwbackend.model.Event;
import jakarta.validation.constraints.NotBlank;

public record UpdateEventRequestDTO(
    @NotBlank String id,
    @NotBlank String title,
    @NotBlank String type,
    @NotBlank String date,
    @NotBlank String time,
    @NotBlank String location,
    String description,
    @NotBlank String status,
    @NotBlank String mode,
    Event.Recurrence recurrence,
    @NotBlank String rev) {}
