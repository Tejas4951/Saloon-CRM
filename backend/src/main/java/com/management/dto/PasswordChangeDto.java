package com.management.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PasswordChangeDto {
	private Integer userId;
	private String oldPassword;
	private String newPassword;
	private String confirmPassword;

}
