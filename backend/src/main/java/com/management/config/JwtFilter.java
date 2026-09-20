package com.management.config;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.management.exception.JwtAuthenticationException;
import com.management.service.impl.MessageService;
import com.management.util.JwtUtil;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {
	private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

	@Autowired
	private JwtUtil jwtUtil;
	
	@Autowired
	private MessageService messageService;
	

	@SuppressWarnings("unused")
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws IOException, ServletException {


		try {
			final String authHeader = request.getHeader("Authorization");
			String token = null;
			String email = null;
			
			log.debug("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
	        log.debug("Authorization header: {}", authHeader);
					    
			if (authHeader != null && authHeader.startsWith("Bearer ")) {
				token = authHeader.substring(7);
				log.debug("Extracted JWT token: {}", token);
				
				if (token != null && jwtUtil.validateToken(token)) {
					 log.debug("JWT token is valid and setting to token holder.");
				}else {
					log.warn("JWT token is invalid or null");
				}
				
				try {
					email = jwtUtil.extractEmail(token);
					 log.debug("Extracted email from token: {}", email);
				} catch (ExpiredJwtException e) {
					log.warn("Expired JWT token: {}", e.getMessage());
					 throw new JwtAuthenticationException(messageService.getMessage("MSG021_TOKEN_EXPIRED"), HttpStatus.UNAUTHORIZED);
				} catch (Exception e) {
					 log.warn("Invalid JWT token: {}", e.getMessage());
					 throw new JwtAuthenticationException(messageService.getMessage("MSG022_INVALID_TOKEN"), HttpStatus.UNAUTHORIZED);
				}
			}

			if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
			    if (jwtUtil.validateToken(token)) {
//			        String role = jwtUtil.extractRole(token); // 🔐 extract "ADMIN" from JWT
//			        log.debug("Extracted role from token: {}", role);
//
//			        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
//			        log.debug("Setting authentication for user: {} with role: {}", email, role);
//
//			        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
//			                email, null, Collections.singletonList(authority)); // ✅ authority passed
//
//			        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
			    	String role = jwtUtil.extractRole(token);
			    	Integer adminId = jwtUtil.extractUserId(token).intValue();

			    	List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

			    	CustomUserDetails customUserDetails = new CustomUserDetails(email, adminId, role, authorities);

			    	UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
			    	        customUserDetails, null, authorities);
			    	authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
			        SecurityContextHolder.getContext().setAuthentication(authentication);
			    }
			}

			filterChain.doFilter(request, response);
		} catch (IOException ex) {
			log.error("Unexpected error in JwtFilter: {}", ex.getMessage(), ex);
			 throw new JwtAuthenticationException(messageService.getMessage("MSG023_INTERNAL_SERVER_ERROR"), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
