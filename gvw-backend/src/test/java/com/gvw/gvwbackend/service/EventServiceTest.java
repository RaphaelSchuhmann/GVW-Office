package com.gvw.gvwbackend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.gvw.gvwbackend.dto.request.AddEventRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateEventRequestDTO;
import com.gvw.gvwbackend.dto.response.EventsResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.exception.NotFoundException;
import com.gvw.gvwbackend.mapper.EventMapper;
import com.gvw.gvwbackend.model.Event;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EventServiceTest {
  @Mock private DbService dbService;

  @Mock private EventMapper eventMapper;

  @InjectMocks private EventService eventService;

  private Event validEvent;

  @BeforeEach
  void setUp() {
    validEvent = new Event();
    validEvent.setId("event-123");
    validEvent.setRev("rev-1");
    validEvent.setTitle("Practice");
    validEvent.setStatus("upcoming");
    validEvent.setMode("single");
    validEvent.setDate("1.12.2026");
  }

  @Test
  void testAllEventsShouldReturnEmptyListWhenNoEventsFound() {
    when(dbService.findAll("events")).thenReturn(List.of());

    EventsResponseDTO response = eventService.allEvents();

    assertTrue(response.data().isEmpty());
    verify(dbService, never()).update(anyString(), any());
  }

  @Test
  void testAllEventsShouldAutoFinishPastSingleEvents() {
    Event pastEvent = new Event();
    pastEvent.setId("past-id");
    pastEvent.setDate("01.01.2025");
    pastEvent.setStatus("upcoming");
    pastEvent.setMode("Single");

    Map<String, Object> eventMap =
        Map.of(
            "id", "past-id",
            "date", "1.1.2025",
            "status", "upcoming",
            "mode", "Single");

    when(dbService.findAll("events")).thenReturn(List.of(eventMap));

    EventsResponseDTO response = eventService.allEvents();

    assertEquals("finished", response.data().getFirst().status());
  }

  @Test
  void testAddEventShouldSuccessForSingleMode() {
    AddEventRequestDTO request =
        new AddEventRequestDTO(
            "Title", "practice", "2.4.2026", "18:00", "Loc", "Desc", "upcoming", "single", null);

    assertDoesNotThrow(() -> eventService.addEvent(request));
    verify(dbService).insert(eq("events"), any(Event.class));
  }

  @Test
  void testAddEventShouldThrowBadRequestForInvalidMonthlyRecurrence() {
    AddEventRequestDTO request =
        new AddEventRequestDTO(
            "Title", "practice", "2.4.2026", "18:00", "Loc", "Desc", "upcoming", "monthly", null);

    assertThrows(BadRequestException.class, () -> eventService.addEvent(request));
    verify(dbService, never()).insert(any(), any());
  }

  @Test
  void testAddEventShouldSuccessForValidMonthlyDateRecurrence() {
    Event.Recurrence recurrence = new Event.Recurrence("date", "15", null, null);
    AddEventRequestDTO request =
        new AddEventRequestDTO(
            "Title",
            "practice",
            "2.4.2026",
            "18:00",
            "Loc",
            "Desc",
            "upcoming",
            "monthly",
            recurrence);

    assertDoesNotThrow(() -> eventService.addEvent(request));
    verify(dbService).insert(eq("events"), any(Event.class));
  }

  @Test
  void testDeleteEventShouldThrowNotFoundWhenIdDoesNotExist() {
    when(dbService.findById("events", "non-existent", Event.class)).thenReturn(null);

    assertThrows(NotFoundException.class, () -> eventService.deleteEvent("non-existent"));
  }

  @Test
  void testDeleteEventShouldCallDbDeleteWhenFound() {
    when(dbService.findById("events", "event-123", Event.class)).thenReturn(validEvent);

    eventService.deleteEvent("event-123");

    verify(dbService).delete("events", "event-123", "rev-1");
  }

  @Test
  void testUpdateEventStatusShouldToggleFromUpcomingToFinished() {
    when(dbService.findById("events", "event-123", Event.class)).thenReturn(validEvent);

    eventService.updateEventStatus("event-123");

    assertEquals("finished", validEvent.getStatus());
    verify(dbService).update("events", validEvent);
  }

  @Test
  void testUpdateEventStatusShouldToggleFromFinishedToUpcoming() {
    validEvent.setStatus("finished");
    when(dbService.findById("events", "event-123", Event.class)).thenReturn(validEvent);

    eventService.updateEventStatus("event-123");

    assertEquals("upcoming", validEvent.getStatus());
    verify(dbService).update("events", validEvent);
  }

  @Test
  void testUpdateEventShouldFetchApplyMappingAndSave() {
    UpdateEventRequestDTO updateDto =
        new UpdateEventRequestDTO(
            "event-123",
            "New Title",
            "practice",
            "5.5.2026",
            "19:00",
            "New Loc",
            "New Desc",
            "upcoming",
            "single",
            null);
    when(dbService.findById("events", "event-123", Event.class)).thenReturn(validEvent);

    eventService.updateEvent(updateDto);

    verify(dbService).findById("events", "event-123", Event.class);
    verify(eventMapper).updateEventFromDto(updateDto, validEvent);
    verify(dbService).update("events", validEvent);
  }

  @Test
  void testUpdateEventShouldThrowNotFoundWhenEventMissing() {
    UpdateEventRequestDTO updateDto =
        new UpdateEventRequestDTO(
            "missing-id",
            "Title",
            "practice",
            "5.5.2026",
            "19:00",
            "Loc",
            "Desc",
            "upcoming",
            "single",
            null);
    when(dbService.findById("events", "missing-id", Event.class)).thenReturn(null);

    assertThrows(NotFoundException.class, () -> eventService.updateEvent(updateDto));

    verify(eventMapper, never()).updateEventFromDto(any(), any());
    verify(dbService, never()).update(anyString(), any());
  }
}
