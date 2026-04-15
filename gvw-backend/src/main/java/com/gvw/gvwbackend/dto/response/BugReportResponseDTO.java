package com.gvw.gvwbackend.dto.response;

import java.time.LocalDateTime;

public record BugReportResponseDTO(
        String id, String title, String severity
) {}
