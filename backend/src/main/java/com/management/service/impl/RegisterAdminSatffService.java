package com.management.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.text.RandomStringGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.management.config.CustomUserDetails;
import com.management.constant.Constants;
import com.management.dto.ApiResponse;
import com.management.dto.RegisterDto;
import com.management.entity.ShopInfo;
import com.management.entity.ShopUser;
import com.management.entity.UserAuth;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.ShopInfoRepo;
import com.management.repo.UserAuthRepo;
import com.management.service.EmailService;
import com.management.service.RegistrationService;
import com.management.util.PhotoUtil;

import jakarta.transaction.Transactional;

@Service
public class RegisterAdminSatffService implements RegistrationService<RegisterDto> {
	
	private static final Logger logger = LoggerFactory.getLogger(RegisterAdminSatffService.class);
	
	private static final String PASSWORDGENSTRING = "!@#$%^&*()_+-=[]{}";

	@Value("${file.upload-dir}")
    private String baseUploadDir;
	
	@Autowired
	private AdminRepo adminRepo;
	@Autowired
	private UserAuthRepo userAuthRepo;

	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private ShopInfoRepo shopInfoRepo;

	@Autowired
	private EmailService emailService;
	
	@Autowired
	private MessageService messageService;
	

	@Override
	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> register(RegisterDto dto) {
		
		logger.info("Received registration request for role: {}, email: {}", dto.getRole(), dto.getEmail());

		UserAuth userAuth = new UserAuth();
		ShopUser admin = new ShopUser();
		String role = dto.getRole().toUpperCase();
		validateUser(dto);
		String photoUrl = null;
		MultipartFile file = dto.getPhotoFile();
		

		photoUrl= PhotoUtil.savePhoto(file, Constants.PREFIX_URL_SHP_USR, baseUploadDir, dto.getUserName(), messageService);
		

		// create initial password
		String password = generatePassword(Constants.PASSWORD_LENGTH);
		logger.debug("Generated password for new user: {}", password);
		try {
			if (role.equals(Constants.ROLE_ADMIN) || role.equals(Constants.ROLE_STAFF) || role.equals(Constants.ROLE_SUPER_ADMIN)) {
				logger.debug("Creating userAuth and admin/staff for role: {}", role);
				// Create UserAuth
				userAuth = createUserAuth(dto, password, role);
				// create admin
				admin = createAdmin(dto, userAuth, photoUrl);
			}

		} catch (DataIntegrityViolationException e) {
			logger.error("Registration failed due to data integrity issue", e);
			throw new BusinessException(messageService.getMessage("MSG002_REGISTRATION_FAILED"), HttpStatus.INTERNAL_SERVER_ERROR);
		}
		sendEmail(admin, userAuth, password);
		logger.info("Registration successful for user: {}", admin.getUserName());
		
		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				 messageService.getMessage("MSG006_REGISTRATION_SUCCESS", new Object[] { dto.getRole() }),
				HttpStatus.OK.value(), null, LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);
	}

	private boolean validateUser(RegisterDto dto) {
		logger.info("Validating user for email: {} and username: {}", dto.getEmail(), dto.getUserName());
		if (!List.of(Constants.ROLE_ADMIN, Constants.ROLE_STAFF, Constants.ROLE_SUPER_ADMIN).contains(dto.getRole().toUpperCase())) {
			logger.warn("Invalid role attempted: {}", dto.getRole());
			throw new BusinessException(messageService.getMessage("MSG007_INVALID_ROLE"), HttpStatus.BAD_REQUEST);
		}
		if (adminRepo.existsByUserName(dto.getUserName())) {
			logger.warn("Username already exists: {}", dto.getUserName());
			throw new BusinessException(messageService.getMessage("MSG008_USERNAME_EXISTS", new Object[] { dto.getUserName() }), HttpStatus.BAD_REQUEST);
		}
		if (!userAuthRepo.findByEmail(dto.getEmail()).isEmpty()) {
			logger.warn("Email already exists: {}", dto.getEmail());
			throw new BusinessException(messageService.getMessage("MSG009_EMAIL_EXISTS", new Object[] { dto.getEmail() }), HttpStatus.BAD_REQUEST);
		}
		return true;
	}

	private void sendEmail(ShopUser admin, UserAuth userAuth, String password) {
		logger.debug("Sending welcome email to: {}", userAuth.getEmail());
		// email service
		Map<String, Object> model = new HashMap<>();
		model.put("name", admin.getFullName());
		model.put("userName", admin.getUserName());
		model.put("password", password);
		// replace null with cc for specific admin of shop
		emailService.sendTemplatedEmail(userAuth.getEmail(), "Welcome onboard", model, "welcome-email.ftl", null);
		logger.info("Welcome email sent to: {}", userAuth.getEmail());
	}

	private UserAuth createUserAuth(RegisterDto dto, String password, String role) {
		UserAuth userAuth = new UserAuth();
		String createdBy;
		CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
		Integer adminId = userDetails.getAdminId();
		ShopUser shopUser = adminRepo.findByAdminId(adminId).orElseThrow(() -> new BusinessException("user from token not found", HttpStatus.BAD_REQUEST));

		if(!shopUser.getUserName().isEmpty()) {
			createdBy = shopUser.getUserName(); // typically the username/email
		} else {
				createdBy = "SYSTEM"; // or null, if no user is logged in (e.g., background task)
			}
		userAuth.setEmail(dto.getEmail());
		userAuth.setPassword(passwordEncoder.encode(password));
		userAuth.setRole(role);
		userAuth.setCreatedBy(createdBy);

		logger.debug("Saving UserAuth for email: {}", dto.getEmail());
		return userAuthRepo.save(userAuth);
	}

	private ShopUser createAdmin(RegisterDto dto, UserAuth userAuth, String photoUrlUpdate) {	
		ShopUser admin = ShopUser.builder().photoUrl(photoUrlUpdate).userName(dto.getUserName()).fullName(dto.getFullName())
				.phoneNumber(dto.getPhoneNumber()).dateOfBirth(dto.getDateOfBirth()).userAuth(userAuth).build();
		if(Constants.ROLE_STAFF.equals(dto.getRole()) || Constants.ROLE_ADMIN.equals(dto.getRole())) {
			if (dto.getShopId() == null || dto.getShopId() == 0) {
			    throw new BusinessException(messageService.getMessage("MSG027_AUTHENTICATED_USER_NOT_FOUND"), HttpStatus.BAD_REQUEST);
			}
			ShopInfo shop = shopInfoRepo.findById(dto.getShopId())
			        .orElseThrow(() -> new BusinessException(messageService.getMessage("MSG010_SHOP_NOT_FOUND", new Object[] { dto.getShopId() }), HttpStatus.NOT_FOUND));
			    
			    // Set shop object to user
			    admin.setShop(shop);
		}
		
		logger.debug("Saving ShopUser with username: {}", admin.getUserName());
		return adminRepo.save(admin);
	}

	private static String generatePassword(int length) {
		RandomStringGenerator pwdGenerator = new RandomStringGenerator.Builder().withinRange(33, 126)
				.filteredBy(c -> Character.isLetterOrDigit(c) || PASSWORDGENSTRING.indexOf(c) >= 0).build();
		return pwdGenerator.generate(length);
	}
}
