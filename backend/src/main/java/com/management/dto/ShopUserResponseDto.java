package com.management.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Builder
@RequiredArgsConstructor
@AllArgsConstructor
public class ShopUserResponseDto {
    private Integer adminId;
    private String userName;
    private String fullName;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String shopName;
    private String role;
}
