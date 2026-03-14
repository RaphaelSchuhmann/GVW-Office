package com.gvw.gvwbackend.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.support.BasicAuthenticationInterceptor;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

  @Bean
  public RestTemplate dbRestTemplate(
      @Value("${couchdb.user}") String user, @Value("${couchdb.password}") String password) {
    RestTemplate restTemplate = new RestTemplate();
    restTemplate.getInterceptors().add(new BasicAuthenticationInterceptor(user, password));
    return restTemplate;
  }
}
