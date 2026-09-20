package com.management.controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.management.dto.ApiResponse;
import com.management.dto.ForgotPasswordDto;
import com.management.dto.PasswordChangeDto;
import com.management.service.impl.PasswordChangeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;


@RestController
public class PasswordController {
	
	@Autowired
	private PasswordChangeService passwordChangeService;
	
	@PostMapping("/passwordchange")
	public ResponseEntity<ApiResponse<String>> passwordChange(@RequestBody PasswordChangeDto passwordChangeDto) {
		
		return passwordChangeService.passwordChange(passwordChangeDto);
	}
	
	@PostMapping("/forgot-password")
	public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestParam String email) {
		
		return passwordChangeService.forgotPassword(email);
	}
	
	@PostMapping("/reset-password")
	public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody ForgotPasswordDto forgotPasswordDto) {
		
		return passwordChangeService.updateForgotPassword(forgotPasswordDto);
	}
	

}
