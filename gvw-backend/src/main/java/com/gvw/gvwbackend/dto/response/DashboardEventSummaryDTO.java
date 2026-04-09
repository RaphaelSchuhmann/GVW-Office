package com.gvw.gvwbackend.dto.response;

public record DashboardEventSummaryDTO(
    String title, String date, String time, String location, String type) {}
