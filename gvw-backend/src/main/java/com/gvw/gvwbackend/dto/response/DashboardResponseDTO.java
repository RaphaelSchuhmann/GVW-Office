package com.gvw.gvwbackend.dto.response;

import com.gvw.gvwbackend.model.Event;
import com.gvw.gvwbackend.model.Member;

import java.util.List;

public record DashboardResponseDTO(
        List<Member> members,
        int totalEvents,
        List<Event> upcomingEvents,
        int totalScores
) {}
