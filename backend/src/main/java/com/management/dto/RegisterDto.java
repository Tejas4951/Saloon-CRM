package com.management.dto;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class RegisterDto {

	private String userName;
    private String email;
    private String fullName;
    private String role;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private Integer shopId;
    private MultipartFile photoFile;
    
}
