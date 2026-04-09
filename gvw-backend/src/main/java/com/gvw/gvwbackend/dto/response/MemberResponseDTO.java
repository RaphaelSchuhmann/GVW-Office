package com.gvw.gvwbackend.dto.response;

import java.time.Instant;

public record MemberResponseDTO(
    String id,
    String rev,
    String name,
    String surname,
    String email,
    String phone,
    String address,
    String voice,
    String status,
    String role,
    Instant birthdate,
    Instant joined) {}
