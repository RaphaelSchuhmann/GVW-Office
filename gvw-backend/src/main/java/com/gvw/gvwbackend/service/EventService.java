package com.gvw.gvwbackend.service;

import com.gvw.gvwbackend.dto.request.AddEventRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateEventRequestDTO;
import com.gvw.gvwbackend.dto.response.EventResponseDTO;
import com.gvw.gvwbackend.dto.response.EventsResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.mapper.EventMapper;
import com.gvw.gvwbackend.model.Event;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class EventService {
  private final ObjectMapper mapper = new ObjectMapper();
  private final DbService dbService;
  private final EventMapper eventMapper;

  public EventService(DbService dbService, EventMapper eventMapper) {
    this.dbService = dbService;
    this.eventMapper = eventMapper;
  }

  public EventsResponseDTO allEvents() {
    List<Map<String, Object>> eventsRaw = dbService.findAll("events");

    List<Event> events =
        eventsRaw.stream().map(map -> mapper.convertValue(map, Event.class)).toList();

    if (events.isEmpty()) {
      return new EventsResponseDTO(List.of());
    }

    for (Event event : events) {
      if (event.getDate() == null || event.getStatus() == null || event.getMode() == null) {
        continue;
      }

      Instant eventDate;
      try {
        eventDate = parseDMYToInstant(event.getDate());
      } catch (RuntimeException e) {
        continue;
      }

      if (eventDate.isBefore(Instant.now())
          && event.getStatus().equals("upcoming")
          && event.getMode().equalsIgnoreCase("single")) {
        event.setStatus("finished");
        dbService.update("events", event);
      }
    }

    List<EventResponseDTO> responseEvents =
        events.stream()
            .map(
                m ->
                    new EventResponseDTO(
                        m.getId(),
                        m.getTitle(),
                        m.getType(),
                        m.getDate(),
                        m.getTime(),
                        m.getLocation(),
                        m.getDescription(),
                        m.getMode(),
                        m.getStatus(),
                        m.getRecurrence()))
            .toList();

    return new EventsResponseDTO(responseEvents);
  }

  public void addEvent(AddEventRequestDTO request) {
    if (!validateRecurrence(request.mode(), request.recurrence())) {
      throw new BadRequestException("InvalidData");
    }

    Event event = createEventFromRequest(request);

    dbService.insert("events", event);
  }

  public void deleteEvent(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Event event = dbService.findById("events", id, Event.class);
    if (event == null) {
      throw new NotFoundException("NotFound");
    }

    dbService.delete("events", event.getId(), event.getRev());
  }

  public void updateEventStatus(String id) {
    if (id == null || id.isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Event event = dbService.findById("events", id, Event.class);
    if (event == null) {
      throw new NotFoundException("NotFound");
    }

    if ("upcoming".equals(event.getStatus())) {
      event.setStatus("finished");
    } else {
      event.setStatus("upcoming");
    }

    dbService.update("events", event);
  }

  public void updateEvent(UpdateEventRequestDTO request) {
    if (request.id() == null || request.id().isBlank()) {
      throw new BadRequestException("InvalidData");
    }

    Event event = dbService.findById("events", request.id(), Event.class);

    if (event == null) {
      throw new NotFoundException("EventNotFound");
    }

    eventMapper.updateEventFromDto(request, event);

    dbService.update("events", event);
  }

  private Instant parseDMYToInstant(String dateStr) {
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d.M.yyyy");

    LocalDate localDate = LocalDate.parse(dateStr, formatter);

    return localDate.atStartOfDay(ZoneOffset.UTC).toInstant();
  }

  private boolean validateRecurrence(String mode, Event.Recurrence recurrence) {
    if (mode.equalsIgnoreCase("single") || mode.equalsIgnoreCase("weekly")) return true;

    if (recurrence == null) return false;

    if (mode.equalsIgnoreCase("monthly")
        && recurrence.getMonthlyKind() != null
        && !recurrence.getMonthlyKind().isBlank()) {
      return switch (recurrence.getMonthlyKind()) {
        case "weekday" ->
            recurrence.getWeekDay() != null
                && !recurrence.getWeekDay().isBlank()
                && recurrence.getOrdinal() != null
                && !recurrence.getOrdinal().isBlank();
        case "date" -> recurrence.getDayOfMonth() != null && !recurrence.getDayOfMonth().isBlank();
        default -> false;
      };
    }

    return false;
  }

  private Event createEventFromRequest(AddEventRequestDTO request) {
    Event event = new Event();
    event.setTitle(request.title());
    event.setType(request.type());
    event.setDate(request.date());
    event.setTime(request.time());
    event.setLocation(request.location());
    event.setDescription(request.description());
    event.setMode(request.mode());
    event.setStatus(request.status());
    event.setRecurrence(request.recurrence());

    return event;
  }
}
