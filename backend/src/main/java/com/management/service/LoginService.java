package com.management.service;

import org.springframework.http.ResponseEntity;

import com.management.dto.ApiResponse;
import com.management.dto.LoginResponseDto;

public interface LoginService<T> {
	
	public ResponseEntity<ApiResponse<LoginResponseDto>> processLogin(T dto);

}
