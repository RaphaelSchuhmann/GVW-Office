package com.gvw.gvwbackend.service;

import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileValidator {
  private static final Set<String> BANNED_EXTENSIONS =
      Set.of("exe", "bat", "sh", "msi", "cmd", "com", "vbs", "js", "jar");

  public boolean isSafe(MultipartFile file) {
    String fileName = file.getOriginalFilename();
    if (fileName == null || !fileName.contains(".")) return false;

    String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    return !BANNED_EXTENSIONS.contains(extension);
  }
}
