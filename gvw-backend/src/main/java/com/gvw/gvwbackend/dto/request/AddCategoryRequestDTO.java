package com.gvw.gvwbackend.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddCategoryRequestDTO(@NotNull String type, @NotNull String displayName) {}
