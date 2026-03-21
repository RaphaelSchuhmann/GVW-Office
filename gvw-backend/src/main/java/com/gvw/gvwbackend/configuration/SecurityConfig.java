package com.gvw.gvwbackend.configuration;

import com.gvw.gvwbackend.middleware.AuthMiddleware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final AuthMiddleware authMiddleware;

  public SecurityConfig(AuthMiddleware authMiddleware) {
    this.authMiddleware = authMiddleware;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/auth/login", "/auth/changePw", "/dev/**").permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(authMiddleware, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}