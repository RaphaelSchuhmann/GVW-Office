package com.gvw.gvwbackend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class DbServiceTest {

  @Mock private RestTemplate restTemplate;

  private DbService dbService;

  @BeforeEach
  void setup() {
    dbService = new DbService("http://localhost:5984", restTemplate);
  }

  @Test
  void testInsertSuccess() {
    Map<String, Object> response = Map.of("ok", true);
    lenient()
        .when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
        .thenReturn(response);

    boolean result = dbService.insert("test_db", Map.of("name", "test"));
    assertTrue(result);
  }

  @Test
  void testInsertFailure() {
    lenient()
        .when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
        .thenReturn(Map.of("ok", false));

    boolean result = dbService.insert("test_db", Map.of("name", "John"));
    assertFalse(result);
  }

  @Test
  void testUpdateSuccess() {
    Map<String, Object> response = Map.of("ok", true);
    lenient()
        .when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
        .thenReturn(response);

    boolean result = dbService.update("test_db", Map.of("name", "newName"));
    assertTrue(result);
  }

  @Test
  void testUpdateFailure() {
    lenient()
        .when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
        .thenReturn(Map.of("ok", false));

    boolean result = dbService.update("test_db", Map.of("name", "John"));
    assertFalse(result);
  }

  @Test
  void testDeleteSuccess() {
    Map<String, Object> response = Map.of("ok", true);
    lenient()
        .when(
            restTemplate.exchange(
                anyString(), eq(org.springframework.http.HttpMethod.DELETE), any(), eq(Map.class)))
        .thenReturn(ResponseEntity.ok(response));

    boolean result = dbService.delete("test_db", "doc_id", "rev");
    assertTrue(result);
  }

  @Test
  void testDeleteFailure() {
    lenient()
        .when(
            restTemplate.exchange(
                anyString(), eq(org.springframework.http.HttpMethod.DELETE), any(), eq(Map.class)))
        .thenReturn(ResponseEntity.ok(Map.of("ok", false)));

    boolean result = dbService.delete("test_db", "doc_id", "rev");
    assertFalse(result);
  }

  @Test
  void testFindAllReturnsDocs() {
    Map<String, Object> doc1 = Map.of("_id", "1", "name", "John");
    Map<String, Object> doc2 = Map.of("_id", "2", "name", "Jane");

    Map<String, Object> row1 = Map.of("doc", doc1);
    Map<String, Object> row2 = Map.of("doc", doc2);

    Map<String, Object> mockResponse = Map.of("rows", List.of(row1, row2));

    when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

    List<Map<String, Object>> result = dbService.findAll("test_db");

    assertEquals(2, result.size());
    assertEquals("John", result.get(0).get("name"));
    assertEquals("Jane", result.get(1).get("name"));

    verify(restTemplate).getForObject(anyString(), eq(Map.class));
  }

  @Test
  void testFindAllReturnsEmptyIfNoRows() {
    Map<String, Object> mockResponse = Map.of();
    when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

    List<Map<String, Object>> result = dbService.findAll("test_db");

    assertTrue(result.isEmpty());
  }

  @Test
  void testFindAllReturnsEmptyIfNull() {
    when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

    List<Map<String, Object>> result = dbService.findAll("test_db");

    assertTrue(result.isEmpty());
  }

  @Test
  void testFindByIdReturnsMap() {
    String json = "{\"_id\":\"1\",\"name\":\"John\"}";
    when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(json);

    Map<String, Object> result = dbService.findById("test_db", "1", Map.class);

    assertEquals("1", result.get("_id"));
    assertEquals("John", result.get("name"));
  }

  @Test
  void testFindByQueryReturnsMap() {
    String json =
        """
            {
              "docs": [
                {"_id": "1", "name": "John"},
                {"_id": "2", "name": "Jane"}
              ],
              "execution_stats": {"total_docs_examined": 2}
            }
            """;

    when(restTemplate.postForObject(anyString(), any(Map.class), eq(String.class)))
        .thenReturn(json);

    List<Map> results = dbService.findByQuery("test_db", Map.of("selector", Map.of()), Map.class);

    assertEquals(2, results.size());
    assertEquals("John", results.get(0).get("name"));
    assertEquals("Jane", results.get(1).get("name"));
  }
}
