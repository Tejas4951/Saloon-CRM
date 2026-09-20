package com.management.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.management.dto.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiResponse<String>> handleBusinessException(BusinessException ex) {
		ApiResponse<String> apiResponse = new ApiResponse<>(false, "Something went wrong!", ex.getHttpStatus().value(),
				null, LocalDateTime.now(), ex.getMessage());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, ex.getHttpStatus());
	}

	// Optional: Catch any unexpected exceptions
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<String>> handleException(Exception ex) {
		ApiResponse<String> apiResponse = new ApiResponse<>(false, "Internal server error",
				HttpStatus.INTERNAL_SERVER_ERROR.value(), null, LocalDateTime.now(), ex.getMessage());
		return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	@ExceptionHandler(JwtAuthenticationException.class)
	public ResponseEntity<ApiResponse<String>> handleJwtAuthenticationException(JwtAuthenticationException ex) {
		ApiResponse<String> apiResponse = new ApiResponse<>(false, "JWT authentication failed",
				ex.getHttpStatus().value(), null, LocalDateTime.now(), ex.getMessage());
		return new ResponseEntity<>(apiResponse, ex.getHttpStatus());
	}

	@ExceptionHandler(EmailSendingException.class)
	public ResponseEntity<ApiResponse<String>> handleEmailSendingException(EmailSendingException ex) {
		ApiResponse<String> apiResponse = new ApiResponse<>(false, "Email sending failed", ex.getHttpStatus().value(),
				null, LocalDateTime.now(), ex.getMessage());
		return new ResponseEntity<>(apiResponse, ex.getHttpStatus());
	}

}
