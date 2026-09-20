package com.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterShopRequestDto {

    private String shopName;
    private String address;
    private String phoneNumber;
    private String email;
    private String ownerName;

}
