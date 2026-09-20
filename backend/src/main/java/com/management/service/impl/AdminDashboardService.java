package com.management.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.management.dto.ApiResponse;
import com.management.dto.ShopUserResponseDto;
import com.management.dto.ShopUserUpdateRequestDto;
import com.management.dto.UserInfoDto;
import com.management.entity.ShopInfo;
import com.management.entity.ShopUser;
import com.management.entity.UserAuth;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.ShopInfoRepo;
import com.management.repo.UserAuthRepo;
import com.management.service.DashboardService;

import jakarta.transaction.Transactional;

@Service
public class AdminDashboardService implements DashboardService {

	private static final Logger logger = LoggerFactory.getLogger(RegisterShopService.class);

	@Autowired
	private AdminRepo adminRepo;
	
	@Autowired
	private UserAuthRepo userAuthRepo;

	@Autowired
	private MessageService messageService;

	@Autowired
	private ShopInfoRepo shopInfoRepo;

	public ResponseEntity<ApiResponse<List<String>>> getAllUserNames() {
		logger.info("Get all usernames request received");

		List<String> allUserNames = adminRepo.getAllByUserNames();

		if (allUserNames == null || allUserNames.isEmpty()) {
			logger.warn("No usernames found in the system.");
		}

		logger.debug("Usernames retrieved: {}", allUserNames);

		ApiResponse<List<String>> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG014_ALL_USERNAMES_LIST"), HttpStatus.OK.value(), allUserNames,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<List<String>>>(apiResponse, HttpStatus.OK);
	}

	public ResponseEntity<ApiResponse<Map<Integer, String>>> getAllShops() {
		logger.info("Get all usernames request received");

		Map<Integer, String> allShopNamesAndId = getShopIdNameMap();

		if (allShopNamesAndId == null || allShopNamesAndId.isEmpty()) {
			logger.warn("No usernames found in the system.");
		}

		logger.debug("Shop name and Id {}", allShopNamesAndId);

		ApiResponse<Map<Integer, String>> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG014_ALL_USERNAMES_LIST"), HttpStatus.OK.value(), allShopNamesAndId,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<Map<Integer, String>>>(apiResponse, HttpStatus.OK);
	}

	private Map<Integer, String> getShopIdNameMap() {
		List<Object[]> results = shopInfoRepo.findAllShopIdAndName();

		return results.stream().collect(Collectors.toMap(row -> ((Long) row[0]).intValue(), row -> (String) row[1]));
	}

	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<Map<String, Object>>> toggleShop(Integer shopId) {
		logger.info("Toggle shop request received");

		ShopInfo shop = shopInfoRepo.findByShopId(shopId).orElseThrow(() -> {
			logger.warn("Shop with ID '{}' not found during booking or operation", shopId);
			return new BusinessException(messageService.getMessage("MSG010_SHOP_NOT_FOUND"), HttpStatus.NOT_FOUND);
		});

		shop.setAvailable(!shop.isAvailable());
		shopInfoRepo.save(shop);

		Map<String, Object> result = new HashMap<>();
		result.put("shopId", shop.getShopId());
		result.put("isAvailable", shop.isAvailable());

		ApiResponse<Map<String, Object>> response = new ApiResponse<>(true,

				messageService.getMessage("MSG034_SHOP_TOGGLED", new Object[] { shop.getShopName() }),
				HttpStatus.OK.value(), result, LocalDateTime.now());

		return new ResponseEntity<>(response, HttpStatus.OK);

	}
	
	public ResponseEntity<ApiResponse<List<UserInfoDto>>> getUserInfoByRole(String role, Integer shopId) {
		
		logger.info("Fetching users by role: {} for shopId: {}", role, shopId);
		
		if (shopId == null || role == null || role.trim().isEmpty()) {
			logger.warn("Invalid request: role or shopId is missing. role='{}', shopId={}", role, shopId);
	        throw new BusinessException(messageService.getMessage("MSG041_EMPTY_ROLE_SHOPID"), HttpStatus.BAD_REQUEST);
	    }
		
		Optional<ShopInfo> shop = shopInfoRepo.findByShopId(shopId);
		
		shop.orElseThrow(() -> {
		    logger.error("Shop not found for ID: {}", shopId);
		    return new BusinessException(messageService.getMessage("MSG010_SHOP_NOT_FOUND", new Object[] { shopId }), HttpStatus.BAD_REQUEST);
		});
		
		List<ShopUser> users = adminRepo.findAllByShopId(shopId);
		logger.debug("Total users fetched for shopId {}: {}", shopId, users.size());
		
		// Filter by role inside UserAuth
		List<UserInfoDto> result = users.stream()
		        .filter(u -> u.getUserAuth() != null)
		        .filter(u -> role.equalsIgnoreCase(u.getUserAuth().getRole()))
		        .map(u -> {
		            UserInfoDto dto = new UserInfoDto();
		            dto.setUserId(u.getAdminId());
		            dto.setFullName(u.getFullName());
		            dto.setRole(u.getUserAuth().getRole());
		            return dto;
		        })
		        .collect(Collectors.toList());
		
		logger.info("Filtered users for role '{}': count = {}", role, result.size());

		
		String message = result.isEmpty()
	            ? "No users found for role: " + role + " in shop ID: " + shopId
	            : messageService.getMessage("MSG040_USER_FETCHED");
		
		ApiResponse<List<UserInfoDto>> response = new ApiResponse<>(true, message, HttpStatus.OK.value(), result,
				LocalDateTime.now());

		logger.info("User fetch operation completed successfully for role: {}, shopId: {}", role, shopId);
		
		return new ResponseEntity<>(response, HttpStatus.OK);
		
	}
	
	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> deleteUserById(Integer userId) {
		logger.info("Delete request received for ID: {}", userId);
		
	    ShopUser user = adminRepo.findByAdminId(userId)
	            .orElseThrow(() -> new BusinessException(
	            	    messageService.getMessage("MSG042_USER_NOT_FOUND_BY_ID", new Object[]{userId}),
	            	    HttpStatus.NOT_FOUND
	            	));

	    UserAuth auth = user.getUserAuth();
	    
	    if (auth == null) {
	    	throw new BusinessException(
	    	        messageService.getMessage("MSG043_USER_AUTH_MISSING", new Object[]{user.getAdminId()}),
	    	        HttpStatus.NOT_FOUND
	    	    );
	    }

	    adminRepo.delete(user);
	    userAuthRepo.delete(auth);

	    logger.info("Deleted user with ID: {} and associated auth ID: {}", userId, (auth != null ? auth.getUserAuthId() : "null"));
	    
	    ApiResponse<String> response = new ApiResponse<>(
	            true,
	            "User deleted successfully",
	            HttpStatus.OK.value(),
	            null,
	            LocalDateTime.now()
	    );

	    return new ResponseEntity<>(response, HttpStatus.OK);
	}
	
	public ResponseEntity<ApiResponse<ShopUserResponseDto>> getUserDetails(Integer userId) {
	    logger.info("Fetch request received for user ID: {}", userId);

	    ShopUser user = adminRepo.findByAdminId(userId)
	        .orElseThrow(() -> new BusinessException(
	            messageService.getMessage("MSG042_USER_NOT_FOUND_BY_ID", new Object[]{userId}),
	            HttpStatus.NOT_FOUND
	        ));

	    ShopUserResponseDto dto = convertToResponseDto(user);

	    ApiResponse<ShopUserResponseDto> response = new ApiResponse<>(
	        true,
	        messageService.getMessage("MSG044_USER_FETCHED_SUCCESSFULLY", new Object[]{userId}),
	        HttpStatus.OK.value(),
	        dto,
	        LocalDateTime.now()
	    );

	    logger.info("Fetched user details for ID: {}", userId);

	    return new ResponseEntity<>(response, HttpStatus.OK);
	}
	
	private ShopUserResponseDto convertToResponseDto(ShopUser user) {
		
	    ShopUserResponseDto dto = new ShopUserResponseDto();
	    dto.setRole(user.getUserAuth().getRole());
	    dto.setAdminId(user.getAdminId());
	    dto.setUserName(user.getUserName());
	    dto.setFullName(user.getFullName());
	    dto.setPhoneNumber(user.getPhoneNumber());
	    dto.setDateOfBirth(user.getDateOfBirth());
	    dto.setShopName(user.getShop() != null ? user.getShop().getShopName() : null);
	    return dto;
	}


	@Transactional
	public ResponseEntity<ApiResponse<String>> updateUserRoleAndShop(ShopUserUpdateRequestDto dto) {logger.info("Update request received for user ID: {}", dto.getUserId());

	// Step 1: Get user by ID
	ShopUser user = adminRepo.findByAdminId(dto.getUserId())
	    .orElseThrow(() -> {
	        String msg = messageService.getMessage("MSG042_USER_NOT_FOUND_BY_ID", new Object[]{dto.getUserId()});
	        logger.error("User not found: {}", msg);
	        return new BusinessException(msg, HttpStatus.NOT_FOUND);
	    });
	logger.debug("User found: {}", user.getFullName());

	// Step 2: Update Shop if name changed
	if (dto.getShopName() != null && !dto.getShopName().isBlank() && 
	    !dto.getShopName().equals(user.getShop().getPhoneNumber())) {

	    logger.info("Shop update requested to: {}", dto.getShopName());

	    ShopInfo shop = shopInfoRepo.findByShopName(dto.getShopName())
	        .orElseThrow(() -> {
	            String msg = messageService.getMessage("MSG046_SHOP_NOT_FOUND_BY_NAME", new Object[]{dto.getShopName()});
	            logger.error("Shop not found: {}", msg);
	            return new BusinessException(msg, HttpStatus.NOT_FOUND);
	        });

	    user.setShop(shop);
	    logger.debug("Shop updated to: {}", shop.getShopName());
	}

	// Step 3: Update Role if changed
	UserAuth auth = user.getUserAuth();
	if (auth == null) {
	    String msg = messageService.getMessage("MSG043_USER_AUTH_MISSING", new Object[]{dto.getUserId()});
	    logger.error("UserAuth missing: {}", msg);
	    throw new BusinessException(msg, HttpStatus.NOT_FOUND);
	}

	if (dto.getRole() != null && !dto.getRole().isBlank() && 
	    !dto.getRole().equals(auth.getRole())) {

	    logger.info("Role update requested to: {}", dto.getRole());
	    auth.setRole(dto.getRole());
	    userAuthRepo.save(auth);
	    logger.debug("Role updated to: {}", dto.getRole());
	}

	// Step 4: Save user and return response
	adminRepo.save(user);
	logger.debug("User saved successfully: ID {}", user.getAdminId());

	String successMsg = messageService.getMessage("MSG047_USER_UPDATED_SUCCESSFULLY", new Object[]{dto.getUserId()});
	logger.info(successMsg);

	ApiResponse<String> response = new ApiResponse<>(
	    true,
	    successMsg,
	    HttpStatus.OK.value(),
	    successMsg,
	    LocalDateTime.now()
	);

	return new ResponseEntity<>(response, HttpStatus.OK);
}


}
