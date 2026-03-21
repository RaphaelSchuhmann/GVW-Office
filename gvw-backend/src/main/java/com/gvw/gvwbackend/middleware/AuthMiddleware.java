package com.gvw.gvwbackend.middleware;

import com.gvw.gvwbackend.exception.InvalidCredentialsException;
import com.gvw.gvwbackend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthMiddleware extends OncePerRequestFilter {
  private final JwtService jwtService;
  private final AntPathMatcher pathMatcher = new AntPathMatcher();

  private final List<String> EXCLUDED_PATHS = List.of("/auth/login", "/dev/**");

  public AuthMiddleware(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();

    return EXCLUDED_PATHS.stream()
            .anyMatch(pattern -> pathMatcher.match(pattern, path));
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String authHeader = request.getHeader("Authorization");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "InvalidToken");
      return;
    }

    String token = authHeader.substring(7);

    try {
      String userId = jwtService.extractUserId(token);

      request.setAttribute("userId", userId);
      filterChain.doFilter(request, response);
    } catch (io.jsonwebtoken.ExpiredJwtException e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "TokenExpired");
    } catch (Exception e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "InvalidToken");
    }
  }
}
