package com.management.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponseDto {
	private String userName;
	private String role;
	private Integer adminId;
	private boolean firstLogin;
	private String token;

}
