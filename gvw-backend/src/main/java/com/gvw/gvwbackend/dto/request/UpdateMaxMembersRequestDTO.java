package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.Positive;

public record UpdateMaxMembersRequestDTO(@Positive int maxMembers) {}
