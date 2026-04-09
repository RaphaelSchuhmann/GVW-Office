package com.gvw.gvwbackend.dto.response;

import java.time.Instant;

public record DashboardEventSummaryDTO(
    String title, Instant date, String time, String location, String type) {}
