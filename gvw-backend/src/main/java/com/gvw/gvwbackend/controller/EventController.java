package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddEventRequestDTO;
import com.gvw.gvwbackend.dto.request.UpdateEventRequestDTO;
import com.gvw.gvwbackend.dto.response.EventsResponseDTO;
import com.gvw.gvwbackend.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/events")
public class EventController {
  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @GetMapping("/all")
  public EventsResponseDTO allEvents() {
    return eventService.allEvents();
  }

  @PostMapping("/add")
  @ResponseStatus(HttpStatus.OK)
  public void addEvent(@Valid @RequestBody AddEventRequestDTO request) {
    eventService.addEvent(request);
  }

  @DeleteMapping("/delete/{id}")
  @ResponseStatus(HttpStatus.OK)
  public void deleteEvent(@PathVariable String id) {
    eventService.deleteEvent(id);
  }

  @PatchMapping("/update/status/{id}")
  @ResponseStatus(HttpStatus.OK)
  public void updateEventStatus(@PathVariable String id) {
    eventService.updateEventStatus(id);
  }

  @PatchMapping("/update")
  @ResponseStatus(HttpStatus.OK)
  public void updateEvent(@Valid @RequestBody UpdateEventRequestDTO request) {
    eventService.updateEvent(request);
  }
}
