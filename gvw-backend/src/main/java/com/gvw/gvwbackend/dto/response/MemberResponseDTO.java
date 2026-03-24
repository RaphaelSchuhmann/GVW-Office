package com.gvw.gvwbackend.dto.response;

public record MemberResponseDTO(
    String id,
    String name,
    String surname,
    String email,
    String phone,
    String address,
    String voice,
    String status,
    String role,
    String birthdate,
    String joined) {}
