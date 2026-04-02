package com.gvw.gvwbackend.configuration;

import com.gvw.gvwbackend.middleware.AuthMiddleware;
import com.gvw.gvwbackend.middleware.EmergencySecurityFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final AuthMiddleware authMiddleware;
  private final EmergencySecurityFilter emergencySecurityFilter;

  public SecurityConfig(AuthMiddleware authMiddleware, EmergencySecurityFilter emergencySecurityFilter) {
    this.authMiddleware = authMiddleware;
    this.emergencySecurityFilter = emergencySecurityFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exc -> exc
                    .authenticationEntryPoint((request, response, authException) -> {
                      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                    })
            )
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(org.springframework.web.cors.CorsUtils::isPreFlightRequest).permitAll()
                    .requestMatchers("/auth/login", "/settings/get").permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(emergencySecurityFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(authMiddleware, EmergencySecurityFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}