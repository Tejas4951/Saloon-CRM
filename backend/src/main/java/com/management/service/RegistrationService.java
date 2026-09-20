package com.management.service;

import org.springframework.http.ResponseEntity;

import com.management.dto.ApiResponse;
import com.management.dto.LoginResponseDto;

public interface RegistrationService<T> {
	
	public ResponseEntity<ApiResponse<String>> register(T dto);
}
