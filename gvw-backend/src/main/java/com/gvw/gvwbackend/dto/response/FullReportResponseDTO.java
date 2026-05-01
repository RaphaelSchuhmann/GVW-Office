package com.gvw.gvwbackend.dto.response;

import com.gvw.gvwbackend.model.TextEditorBlock;
import java.util.List;

public record FullReportResponseDTO(
    String id,
    String title,
    String author,
    String rev,
    int readingTimeInMinutes,
    List<TextEditorBlock> content) {}
