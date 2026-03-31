package com.gvw.gvwbackend.dto.response;

import com.gvw.gvwbackend.model.Event;

public record EventResponseDTO(
    String id,
    String title,
    String type,
    String date,
    String time,
    String location,
    String description,
    String mode,
    String status,
    Event.Recurrence recurrence) {}
