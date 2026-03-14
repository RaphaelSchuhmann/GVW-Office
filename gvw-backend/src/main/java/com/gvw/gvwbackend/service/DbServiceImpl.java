package com.gvw.gvwbackend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

// TODO: Implement logger calls (ECONNREFUSED)

@Service
public class DbServiceImpl implements DbService {
  private final RestTemplate restTemplate;
  private final String baseUrl;

  private final String[] databases = {
    "users", "members", "events", "reports", "app_settings", "emergency_token", "library"
  };
  private final String appSettingsDb = "app_settings";
  private Map<String, Object> DEFAULT_SETTINGS = new HashMap<>();

  public DbServiceImpl(
      @Value("${couchdb.url}") String baseUrl,
      @Qualifier("dbRestTemplate") RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
    this.baseUrl = baseUrl;

    // Default settings
    DEFAULT_SETTINGS.put("_id", "general");
    DEFAULT_SETTINGS.put("maxMembers", 10);

    Map<String, String> scoreCategories = new HashMap<>();
    scoreCategories.put("", "all");
    scoreCategories.put("all", "Alle Kategorien");
    scoreCategories.put("Alle Kategorien", "all");

    DEFAULT_SETTINGS.put("scoreCategories", scoreCategories);
  }

  @Override
  public <T> boolean insert(String db, T doc) {
    String url = String.format("%s/%s", baseUrl, db);
    Map<String, Object> resp = restTemplate.postForObject(url, doc, Map.class);

    return resp != null && Boolean.TRUE.equals(resp.get("ok"));
  }

  @Override
  public <T> boolean update(String db, T doc) {
    return insert(db, doc);
  }

  @Override
  public boolean delete(String db, String id, String rev) {
    String url = String.format("%s/%s/%s?rev=%s", baseUrl, db, id, rev);
    Map<String, Object> resp =
        restTemplate.exchange(url, HttpMethod.DELETE, null, Map.class).getBody();

    return resp != null && Boolean.TRUE.equals(resp.get("ok"));
  }

  @Override
  public List<Map<String, Object>> findAll(String db) {
    String url = String.format("%s/%s/_all_docs?include_docs=true", baseUrl, db);
    Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
    if (resp == null || !resp.containsKey("rows")) {
      return List.of();
    }

    List<Map<String, Object>> docs = new ArrayList<>();
    List<Map<String, Object>> rows = (List<Map<String, Object>>) resp.get("rows");

    for (Map<String, Object> row : rows) {
      Map<String, Object> doc = (Map<String, Object>) row.get("doc");
      if (doc != null) docs.add(doc);
    }

    return docs;
  }

  @Override
  public <T> T findById(String db, String id, Class<T> clazz) {
    String url = String.format("%s/%s/%s", baseUrl, db, id);
    String json = restTemplate.getForObject(url, String.class);

    try {
      ObjectMapper objectMapper = new ObjectMapper();
      return objectMapper.readValue(json, clazz);
    } catch (Exception e) {
      throw new RuntimeException("Failed to map JSON to " + clazz.getSimpleName(), e);
    }
  }

  @Override
  public <T> List<T> findByQuery(String db, Map<String, Object> query, Class<T> clazz) {
    String url = String.format("%s/%s/_find", baseUrl, db);
    String resp = restTemplate.postForObject(url, query, String.class);

    try {
      ObjectMapper objectMapper = new ObjectMapper();

      Map<String, Object> map =
          objectMapper.readValue(resp, new TypeReference<Map<String, Object>>() {});

      List<Map<String, Object>> docs = (List<Map<String, Object>>) map.get("docs");

      if (docs == null) return List.of();

      return docs.stream()
          .map(doc -> objectMapper.convertValue(doc, clazz))
          .collect(Collectors.toList());
    } catch (Exception e) {
      throw new RuntimeException("Failed to map JSON to " + clazz.getSimpleName(), e);
    }
  }

  @Override
  public void createDatabases() {
    for (String database : databases) {
      String url = String.format("%s/%s", baseUrl, database);

      try {
        ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.PUT, null, Void.class);
        if (response.getStatusCode().is2xxSuccessful()) continue;
      } catch (HttpClientErrorException e) {
        if (e.getStatusCode() == HttpStatusCode.valueOf(412)) {
          // TODO: Replace with logger call
          System.out.println("Database " + database + " already exists");
        } else {
          // TODO: Replace with logger call
          System.out.println("Error creating database " + database + ": " + e.getStatusCode());
        }
        continue;
      }
    }

    // Ensure default settings document exists in app_settings
    String url = String.format("%s/%s/general", baseUrl, appSettingsDb);
    try {
      ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

      // Delete existing default settings document
      if (response.getStatusCode().is2xxSuccessful()) {
        Map<String, Object> existingDoc = response.getBody();
        if (existingDoc != null) {
          delete(appSettingsDb, (String) existingDoc.get("_id"), (String) existingDoc.get("_rev"));
        }
      }
    } catch (HttpClientErrorException e) {
      // TODO: Replace with logger call
      System.out.println("Warn: No existing default settings document found (this is expected on first start)");
    }

    boolean successful = insert(appSettingsDb, DEFAULT_SETTINGS);
    if (!successful) {
      // TODO: Replace with logger call
      System.out.println("Error: Failed to insert default settings document");
      return;
    }

    // TODO: Replace with logger call
    System.out.println("Default settings document inserted successfully");
  }
}
