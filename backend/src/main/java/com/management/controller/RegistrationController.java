package com.management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.management.dto.ApiResponse;
import com.management.dto.RegisterDto;
import com.management.dto.RegisterServiceDto;
import com.management.dto.RegisterShopRequestDto;
import com.management.service.impl.RegisterAdminSatffService;
import com.management.service.impl.RegisterServiceInfoService;
import com.management.service.impl.RegisterShopService;

@RestController
@RequestMapping("/register")
public class RegistrationController {

	@Autowired
	RegisterAdminSatffService registerService;

	@Autowired
	RegisterShopService registerShopService;

	@Autowired
	private RegisterServiceInfoService registerServiceInfoService;

	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN) or hasRole(T(com.management.constant.Constants).ROLE_ADMIN)")
	@PostMapping("/staff")
	public ResponseEntity<ApiResponse<String>> registerStaff(@RequestPart("data") RegisterDto dto,
		    @RequestPart(value = "photoFile", required = false) MultipartFile photoFile) {
		
		dto.setPhotoFile(photoFile);
		return registerService.register(dto);
	}

	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/admin")
	public ResponseEntity<ApiResponse<String>> registerAdmin(@RequestPart("data") RegisterDto dto,
		    @RequestPart(value = "photoFile", required = false) MultipartFile photoFile) {
		
		dto.setPhotoFile(photoFile);
		return registerService.register(dto);

	}

	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/shop")
	public ResponseEntity<ApiResponse<String>> registerShop(
			@RequestBody RegisterShopRequestDto registerShopRequestDto) {

		return registerShopService.register(registerShopRequestDto);

	}

	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/serviceinfo")
	public ResponseEntity<ApiResponse<String>> registerService(
			@RequestPart("data") RegisterServiceDto registerServiceDto,
			@RequestPart(value = "photoFile", required = true) MultipartFile photoFile) {

		registerServiceDto.setPhotoFile(photoFile);
		return registerServiceInfoService.register(registerServiceDto);

	}

	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/super-admin")
	public ResponseEntity<ApiResponse<String>> registerSuperAdmin(@RequestPart("data") RegisterDto dto,
		    @RequestPart(value = "photoFile", required = false) MultipartFile photoFile) {
		
		dto.setPhotoFile(photoFile);
		return registerService.register(dto);

	}

}
