package com.management.service.impl;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.management.config.CustomUserDetails;
import com.management.constant.Constants;
import com.management.dto.ApiResponse;
import com.management.dto.RegisterServiceDto;
import com.management.entity.ServiceInfo;
import com.management.entity.ServiceInfo.Gender;
import com.management.entity.ShopInfo;
import com.management.entity.ShopUser;
import com.management.entity.UserAuth;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.ServiceInfoRepo;
import com.management.repo.ShopInfoRepo;
import com.management.repo.UserAuthRepo;
import com.management.service.RegistrationService;
import com.management.util.PhotoUtil;

import jakarta.transaction.Transactional;

@Service
public class RegisterServiceInfoService implements RegistrationService<RegisterServiceDto> {
	
	private static final Logger logger = LoggerFactory.getLogger(RegisterServiceInfoService.class);
	
	
	@Value("${file.upload-dir}")
    private String baseUploadDir;

	@Autowired
	private ServiceInfoRepo serviceInfoRepo;

	@Autowired
	private AdminRepo adminRepo;


	@Autowired
	private MessageService messageService;
	
	@Autowired
	private UserAuthRepo userAuthRepo;
	
	@Autowired
	private ShopInfoRepo shopInfoRepo;

	@Override
	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> register(RegisterServiceDto dto) {
		logger.info("Received request to register service: {}", dto.getServiceName());
		ServiceInfo serviceInfo = new ServiceInfo();
		validateRequest(dto);
		
		String photoUrl = null;
		MultipartFile file = dto.getPhotoFile();
		
		photoUrl= PhotoUtil.savePhoto(file, Constants.PREFIX_URL_SERVICE_IMG, baseUploadDir, dto.getServiceName(), messageService);
		
		CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
		String email = userDetails.getUsername();
		
		Gender gender = Gender.valueOf(dto.getGenderApplicable().toUpperCase());
	
		serviceInfoRepo.findByServiceNameAndGenderApplicableAndShop_ShopId(
		        dto.getServiceName(), 
		        gender, 
		        dto.getShopId()
		).ifPresent(existing -> {
		    logger.warn("Duplicate service '{}' with gender '{}' attempted for Shop ID {}", 
		        dto.getServiceName(), dto.getGenderApplicable(), dto.getShopId());
		    
		    String msg = messageService.getMessage(
		        "MSG035_SERVICE_ALREADY_REGISTERED");
		    
		    throw new BusinessException(msg, HttpStatus.BAD_REQUEST);
		});

	    UserAuth auth = userAuthRepo.findByEmail(email)
	        .orElseThrow(() -> {
				logger.error("Authenticated user not found for email: {}", email);
				return new BusinessException(messageService.getMessage("MSG027_AUTHENTICATED_USER_NOT_FOUND"), HttpStatus.UNAUTHORIZED);
			});
	    
	    ShopUser shopUser = adminRepo.findByUserAuth(auth).orElseThrow(() -> {
			logger.error("Shop user not found for authenticated user: {}", email);
			return new BusinessException(messageService.getMessage("MSG027_AUTHENTICATED_USER_NOT_FOUND"), HttpStatus.UNAUTHORIZED);
		});
	    
	    ShopInfo shopInfo = shopInfoRepo.findByShopId(dto.getShopId()).orElseThrow(() -> {
			logger.error("Shop user not found for authenticated user: {}", email);
			return new BusinessException(messageService.getMessage("MSG010_SHOP_NOT_FOUND", new Object[] { dto.getShopId()}),
				    HttpStatus.UNAUTHORIZED);
		});
	    
		try {
			serviceInfo.setServiceName(dto.getServiceName());
			serviceInfo.setDescription(dto.getDescription());
			serviceInfo.setTotalPrice(dto.getTotalPrice());
			serviceInfo.setDurationMinutes(dto.getDurationMinutes());
			serviceInfo.setCategory(dto.getCategory());
			serviceInfo.setShop(shopInfo);
			serviceInfo.setPhotoUrl(photoUrl);
			serviceInfo.setGenderApplicable(Gender.valueOf(dto.getGenderApplicable().toUpperCase()));
			serviceInfo.setIsActive(true); // default
			serviceInfo.setCreatedBy(shopUser.getUserName());
			logger.debug("Saving service info: {}", dto.getServiceName());
			serviceInfoRepo.save(serviceInfo);

		} catch (DataIntegrityViolationException e) {
			logger.error("Data integrity violation while saving service: {}", dto.getServiceName(), e);
			throw new BusinessException(messageService.getMessage("MSG013_DATA_INTEGRITY_VIOLATION"),
					HttpStatus.BAD_REQUEST);
		}
		
		logger.info("Service '{}' registered successfully by {}", dto.getServiceName(), shopUser.getUserName());

		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG026_SHOP_REGISTERED_SUCCESSFULLY"), HttpStatus.OK.value(), null,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);
	}

	private void validateRequest(RegisterServiceDto dto) {
		logger.debug("Validating RegisterServiceDto: {}", dto);

		if (dto.getServiceName() == null || dto.getServiceName().isBlank()) {
			logger.warn("Validation failed: Service name is required");
			throw new BusinessException(messageService.getMessage("MSG028_SERVICE_NAME_REQUIRED"), HttpStatus.BAD_REQUEST);
		}
		if (dto.getTotalPrice() == null || dto.getTotalPrice().doubleValue() <= 0) {
			logger.warn("Validation failed: Total price must be positive");
			throw new BusinessException(messageService.getMessage("MSG029_TOTAL_PRICE_MUST_BE_POSITIVE"), HttpStatus.BAD_REQUEST);
		}

		if (dto.getDurationMinutes() == null || dto.getDurationMinutes() <= 0) {
			logger.warn("Validation failed: Duration must be positive");
			throw new BusinessException(messageService.getMessage("MSG030_DURATION_MUST_BE_POSITIVE"), HttpStatus.BAD_REQUEST);
		}

		if (dto.getGenderApplicable() == null || dto.getGenderApplicable().isBlank()) {
			logger.warn("Validation failed: Gender applicable is required");
			throw new BusinessException(messageService.getMessage("MSG031_GENDER_APPLICABLE_REQUIRED"), HttpStatus.BAD_REQUEST);
		}

		try {
			Gender.valueOf(dto.getGenderApplicable().toUpperCase());
		} catch (IllegalArgumentException ex) {
			logger.warn("Validation failed: Invalid gender value '{}'", dto.getGenderApplicable());
			throw new BusinessException(messageService.getMessage("MSG032_INVALID_GENDER_VALUE"), HttpStatus.BAD_REQUEST);
		}

	}
}
