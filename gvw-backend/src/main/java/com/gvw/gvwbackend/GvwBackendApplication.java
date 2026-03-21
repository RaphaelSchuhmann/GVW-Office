package com.gvw.gvwbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Map;

@SpringBootApplication(excludeName = {
        "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration",
        "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
})
public class GvwBackendApplication {

  public static void main(String[] args) {
    SpringApplication app = new SpringApplication(GvwBackendApplication.class);

    app.setDefaultProperties(Map.of("server.port", 3500));

    app.run(args);
  }
}
