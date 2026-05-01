package com.gvw.gvwbackend.model;

import java.io.InputStream;
import lombok.Data;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;

@Data
public class AttachmentResource {
  private final Resource resource;
  private final String contentType;

  public AttachmentResource(InputStream inputStream, String contentType) {
    this.resource = new InputStreamResource(inputStream);
    this.contentType = contentType;
  }
}
