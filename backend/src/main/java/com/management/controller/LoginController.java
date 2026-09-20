package com.management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.management.dto.ApiResponse;
import com.management.dto.LoginDto;
import com.management.dto.LoginResponseDto;
import com.management.service.impl.LoginAdminServiceImpl;

@RestController
public class LoginController {

	@Autowired
	private LoginAdminServiceImpl loginAdminServiceImpl;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@RequestBody LoginDto loginDto) {
        
    	return loginAdminServiceImpl.processLogin(loginDto);
    }
}
