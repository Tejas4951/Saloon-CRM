package com.management.dto;

import java.math.BigDecimal;

import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterServiceDto {

    private String serviceName;
    private String description;
    private Integer shopId;
    private BigDecimal totalPrice;
    private Integer durationMinutes;
    private String category;
    private String genderApplicable; // "MALE", "FEMALE", "UNISEX"
    private MultipartFile photoFile;
}
