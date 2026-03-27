package com.gvw.gvwbackend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class HashUtil {
  private final MessageDigest messageDigest;

  public HashUtil() {
    try {
      this.messageDigest = MessageDigest.getInstance("SHA-256");
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("JVW does not support SHA-256", e);
    }
  }

  public String createHash(String value) {
    if (value == null) return null;

    byte[] encodedHash = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));

    return HexFormat.of().formatHex(encodedHash);
  }

  public boolean compare(String rawInput, String storedHash) {
    if (rawInput == null || storedHash == null) return false;

    String inputHash = createHash(rawInput);

    return MessageDigest.isEqual(
        inputHash.getBytes(StandardCharsets.UTF_8), storedHash.getBytes(StandardCharsets.UTF_8));
  }
}
