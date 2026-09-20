package com.management.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShopUserUpdateRequestDto {

	private Integer userId;
	private String role;
	private String shopName;
}
