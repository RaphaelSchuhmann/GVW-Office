package com.gvw.gvwbackend.service;

import java.util.List;
import java.util.Map;

public interface DbService {
  public <T> boolean insert(String db, T doc);

  public <T> boolean update(String db, T doc); // ID can be obtained via the passed doc

  public boolean delete(String db, String id, String rev);

  public List<Map<String, Object>> findAll(String db);

  public <T> T findById(String db, String id, Class<T> clazz);

  public <T> List<T> findByQuery(String db, Map<String, Object> query, Class<T> clazz);

  public void createDatabases();
}
