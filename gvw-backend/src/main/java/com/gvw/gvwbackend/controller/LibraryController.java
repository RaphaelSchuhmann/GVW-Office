package com.gvw.gvwbackend.controller;

import com.gvw.gvwbackend.dto.request.AddScoreRequestDTO;
import com.gvw.gvwbackend.dto.response.ScoresResponseDTO;
import com.gvw.gvwbackend.exception.BadRequestException;
import com.gvw.gvwbackend.service.FileValidator;
import com.gvw.gvwbackend.service.LibraryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/library")
public class LibraryController {
  private final LibraryService libraryService;
  private final FileValidator fileValidator;

  public LibraryController(LibraryService libraryService, FileValidator fileValidator) {
    this.libraryService = libraryService;
    this.fileValidator = fileValidator;
  }

  @GetMapping("/all")
  public ScoresResponseDTO getAllScores() {
    return libraryService.getAllScores();
  }

  @PostMapping(value = "/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.OK)
  public void createScore(@RequestPart("scoreData") @Valid AddScoreRequestDTO request, @RequestPart("files") List<MultipartFile> files) {
    for (MultipartFile file : files) {
      if (!fileValidator.isSafe(file)) {
        throw new BadRequestException("InvalidFileExtension");
      }
    }

    libraryService.createScore(request, files);
  }
}
