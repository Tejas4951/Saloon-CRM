package com.management.config;

import java.io.IOException;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.management.dto.ApiResponse;
import com.management.service.impl.MessageService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
	
	 private static final Logger logger = LoggerFactory.getLogger(CustomAccessDeniedHandler.class);

	@Autowired
    private final ObjectMapper objectMapper;
	
	@Autowired
	private MessageService messageService;

    
    public CustomAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
    	
    	 String path = request.getRequestURI();
         String method = request.getMethod();
         String user = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";

         logger.warn("Access denied: User='{}' tried to access protected resource: {} {}", user, method, path);
         logger.debug("AccessDeniedException message: {}", accessDeniedException.getMessage());

        ApiResponse<String> apiResponse = new ApiResponse<>(
                false,
                messageService.getMessage("MSG015_ACCESS_DENIED"),
                HttpStatus.FORBIDDEN.value(),
                null,
                LocalDateTime.now()
        );

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), apiResponse); // ✅ use injected mapper
    }
}
