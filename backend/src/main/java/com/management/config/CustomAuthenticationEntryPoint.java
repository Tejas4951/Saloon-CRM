package com.management.config;

import java.io.IOException;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.management.dto.ApiResponse;
import com.management.exception.JwtAuthenticationException;
import com.management.service.impl.MessageService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
	
	private static final Logger logger = LoggerFactory.getLogger(CustomAuthenticationEntryPoint.class);

	 @Autowired
    private final ObjectMapper objectMapper;
	 
	 @Autowired
	 private MessageService messageService;

   
    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
    	
    	String path = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = request.getRemoteAddr();

        HttpStatus status = HttpStatus.UNAUTHORIZED;
        String message = messageService.getMessage("MSG016_AUTHENTICATION_FAILED");

//        if (ex instanceof JwtAuthenticationException) {
//            JwtAuthenticationException jwtEx = (JwtAuthenticationException) authException;
//            status = jwtEx.getHttpStatus();
//            message = jwtEx.getMessage();
//            logger.warn("JWT authentication failed at {} {} from IP {}: {}", method, path, clientIp, message);
//        }
        
        if (authException instanceof JwtAuthenticationException jwtEx) {
            status = jwtEx.getHttpStatus();
            message = jwtEx.getMessage();
            logger.warn("JWT authentication failed at {} {} from IP {}: {}", method, path, clientIp, message);
        }

        ApiResponse<String> apiResponse = new ApiResponse<>(
                false,
                message,
                status.value(),
                null,
                LocalDateTime.now()
        );

        response.setStatus(status.value());
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), apiResponse);
    }
}
