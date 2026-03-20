package com.gvw.gvwbackend.service;

import static net.logstash.logback.argument.StructuredArguments.kv;

import java.net.ConnectException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class DbServiceImpl implements DbService {
  private final RestTemplate restTemplate;
  private final String baseUrl;

  private final String[] databases = {
    "users", "members", "events", "reports", "app_settings", "emergency_token", "library"
  };
  private final String appSettingsDb = "app_settings";
  private Map<String, Object> DEFAULT_SETTINGS = new HashMap<>();

  private static final Logger log = LoggerFactory.getLogger(DbServiceImpl.class);

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
    log.info("DB Service initialized");
  }

  @Override
  public <T> boolean insert(String db, T doc) {
    String url = String.format("%s/%s", baseUrl, db);
    Map<String, Object> resp =
        safeExecute(() -> restTemplate.postForObject(url, doc, Map.class), db);
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
        safeExecute(
            () -> restTemplate.exchange(url, HttpMethod.DELETE, null, Map.class).getBody(), db);
    return resp != null && Boolean.TRUE.equals(resp.get("ok"));
  }

  @Override
  public List<Map<String, Object>> findAll(String db) {
    String url = String.format("%s/%s/_all_docs?include_docs=true", baseUrl, db);
    Map<String, Object> resp = safeExecute(() -> restTemplate.getForObject(url, Map.class), db);

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
    String json = safeExecute(() -> restTemplate.getForObject(url, String.class), db);
    if (json == null || json.isEmpty()) return null;

    try {
      return new ObjectMapper().readValue(json, clazz);
    } catch (Exception e) {
      log.error("Failed to map JSON to {}", clazz.getSimpleName(), e);
      throw new RuntimeException("Failed to map JSON to " + clazz.getSimpleName(), e);
    }
  }

  @Override
  public <T> List<T> findByQuery(String db, Map<String, Object> query, Class<T> clazz) {
    String url = String.format("%s/%s/_find", baseUrl, db);
    String resp = safeExecute(() -> restTemplate.postForObject(url, query, String.class), db);

    if (resp == null || resp.isEmpty()) return List.of();

    try {
      ObjectMapper objectMapper = new ObjectMapper();

      Map<String, Object> map = objectMapper.readValue(resp, new TypeReference<>() {});
      List<Map<String, Object>> docs = (List<Map<String, Object>>) map.get("docs");

      if (docs == null) return List.of();

      return docs.stream()
          .map(doc -> objectMapper.convertValue(doc, clazz))
          .collect(Collectors.toList());
    } catch (Exception e) {
      log.error("Failed to map JSON to {}", clazz.getSimpleName(), e);
      throw new RuntimeException("Failed to map JSON to " + clazz.getSimpleName(), e);
    }
  }

  @Override
  public void createDatabases() {
    for (String database : databases) {
      String url = String.format("%s/%s", baseUrl, database);

      try {
        ResponseEntity<Void> resp = restTemplate.exchange(url, HttpMethod.PUT, null, Void.class);
      } catch (ResourceAccessException e) {
        if (isConnectionRefused(e)) {
          log.error("DB connection refused {}", kv("db", database), kv("error", "ECONNREFUSED"));
        } else {
          log.error(
              "DB network error {}", kv("db", database), kv("error", e.getCause().getMessage()), e);
        }
      } catch (HttpStatusCodeException e) {
        if (e.getStatusCode() == HttpStatusCode.valueOf(412)) {
          log.error("DB already exists {}", kv("db", database));
          continue;
        }

        log.error(
            "DB creation failed {}",
            kv("db", database),
            kv("status", e.getStatusCode().value()),
            e);
      } catch (Exception e) {
        log.error("Unexpected db error {}", kv("db", database), kv("error", e.getMessage()), e);
      }
    }

    // Ensure default settings document exists in app_settings
    // Delete existing default settings document
    String url = String.format("%s/%s/general", baseUrl, appSettingsDb);
    ResponseEntity<Map> resp =
        safeExecute(() -> restTemplate.getForEntity(url, Map.class), appSettingsDb);

    if (resp != null && resp.getStatusCode().is2xxSuccessful()) {
      Map<String, Object> existingDoc = resp.getBody();
      if (existingDoc != null) {
        delete(appSettingsDb, (String) existingDoc.get("_id"), (String) existingDoc.get("_rev"));
      }
    }

    boolean successful = insert(appSettingsDb, DEFAULT_SETTINGS);
    if (!successful) {
      log.error("Failed to insert default settings document {}", kv("db", appSettingsDb));
      return;
    }

    log.info(
        "Inserted default settings document (If you got a request failed it can be ignored)  {}",
        kv("db", appSettingsDb));
  }

  private <T> T safeExecute(Supplier<T> action, String db) {
    try {
      return action.get();
    } catch (ResourceAccessException e) {
      if (isConnectionRefused(e)) {
        log.error("DB connection refused {} {}", kv("db", db), kv("error", "ECONNREFUSED"));
      } else {
        log.error(
            "DB network error {} {}", kv("db", db), kv("error", e.getCause().getMessage()), e);
      }
      return null;
    } catch (HttpStatusCodeException e) {
      log.error(
          "DB request failed {} {}", kv("db", db), kv("status", e.getStatusCode().value()), e);
      return null;
    } catch (Exception e) {
      log.error("Unexpected db error {} {}", kv("db", db), kv("error", e.getMessage()), e);
      return null;
    }
  }

  private boolean isConnectionRefused(Throwable e) {
    while (e != null) {
      if (e instanceof ConnectException) return true;
      e = e.getCause();
    }
    return false;
  }
}
