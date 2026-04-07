package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddChangelogRequestDTO;
import com.gvw.gvwbackend.dto.response.ChangelogsResponseDTO;
import com.gvw.gvwbackend.service.ChangelogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/changelog")
public class ChangelogController {
  private final ChangelogService changelogService;

  public ChangelogController(ChangelogService changelogSerice) {
    this.changelogService = changelogSerice;
  }

  @GetMapping("/all")
  public ChangelogsResponseDTO getChangelogs() {
    return changelogService.getChangelogs();
  }

  @PostMapping("/add")
  @ResponseStatus(HttpStatus.OK)
  public void addChangelog(@Valid @RequestBody AddChangelogRequestDTO request) {
    changelogService.addChangelog(request);
  }

  @DeleteMapping("/delete/{id}")
  @ResponseStatus(HttpStatus.OK)
  public void deleteChangelog(@PathVariable String id) {
    changelogService.deleteChangelog(id);
  }
}
