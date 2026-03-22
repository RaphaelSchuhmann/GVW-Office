package com.gvw.gvwbackend.dto.response;

import java.util.Map;

public record AppSettingsResponseDTO(int maxMembers, Map<String, String> scoreCategories) {}
