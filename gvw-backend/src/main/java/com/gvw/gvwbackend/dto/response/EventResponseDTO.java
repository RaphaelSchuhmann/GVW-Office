package com.gvw.gvwbackend.dto.response;

import com.gvw.gvwbackend.model.Event;
import java.time.Instant;

public record EventResponseDTO(
    String id,
    String rev,
    String title,
    String type,
    Instant date,
    String time,
    String location,
    String description,
    String mode,
    String status,
    Event.Recurrence recurrence) {}
