package com.management.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.management.dto.ApiResponse;
import com.management.dto.RegisterShopRequestDto;
import com.management.entity.ShopInfo;
import com.management.exception.BusinessException;
import com.management.repo.ShopInfoRepo;
import com.management.service.RegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.transaction.Transactional;

@Service
public class RegisterShopService implements RegistrationService<RegisterShopRequestDto> {
	
	private static final Logger logger = LoggerFactory.getLogger(RegisterShopService.class);
	
	@Autowired
	private ShopInfoRepo shopInfoRepo;
	
	@Autowired
	private MessageService messageService;

	@Override
	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> register(RegisterShopRequestDto dto) {
		
		logger.info("Register shop request received for: {}", dto.getShopName());
		logger.debug("RegisterShopRequestDto: {}", dto);
		
		shopInfoRepo.findByShopName(dto.getShopName())
	    .ifPresent(shop -> {
	    	logger.warn("Registration failed: shop name '{}' already exists", dto.getShopName());
	        throw new BusinessException(messageService.getMessage("MSG011_SHOP_NAME_EXISTS"), HttpStatus.CONFLICT);
	    });
		
		registerShop(dto);
		logger.info("Shop '{}' registered successfully", dto.getShopName());
		
		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG012_SHOP_REGISTRATION_SUCCESS"),
				HttpStatus.OK.value(), null, LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);
	}
	
	private void registerShop(RegisterShopRequestDto dto){		
		try {
			logger.info("Attempting to register shop: {}", dto.getShopName());
			logger.debug("Shop registration details: {}", dto);
			
			ShopInfo shop = ShopInfo.builder()
			        .address(dto.getAddress())
			        .email(dto.getEmail())
			        .ownerName(dto.getOwnerName())
			        .phoneNumber(dto.getPhoneNumber())
			        .shopName(dto.getShopName())
			        .build();

			    shopInfoRepo.save(shop); 
		} catch (DataIntegrityViolationException e) {
			logger.error("Data integrity violation while registering shop '{}'", dto.getShopName(), e);
			throw new BusinessException(messageService.getMessage("MSG013_SHOP_DATA_VIOLATION"), HttpStatus.CONFLICT);
		}
	}

}
