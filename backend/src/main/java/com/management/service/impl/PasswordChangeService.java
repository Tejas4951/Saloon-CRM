package com.management.service.impl;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.management.dto.ApiResponse;
import com.management.dto.ForgotPasswordDto;
import com.management.dto.PasswordChangeDto;
import com.management.entity.PasswordResetOtp;
import com.management.entity.ShopUser;
import com.management.entity.UserAuth;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.PasswordResetOtpRepository;
import com.management.repo.UserAuthRepo;
import com.management.service.EmailService;

import jakarta.transaction.Transactional;

@Service
public class PasswordChangeService {

	private static final Logger logger = LoggerFactory.getLogger(PasswordChangeService.class);

	@Autowired
	private AdminRepo adminRepo;

	@Autowired
	UserAuthRepo userAuthRepo;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private MessageService messageService;

	@Autowired
	private EmailService emailService;

	@Autowired
	private PasswordResetOtpRepository otpRepository;
	
	private static final Integer OTP_EXPIRY = 5;
	private static final String OTP_REQUEST_EMAIL_SUBJECT ="OTP for forgot password request";

	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> passwordChange(PasswordChangeDto changeDto) {

		logger.info("Password change request received for userId: {}", changeDto.getUserId());

		ShopUser admin = adminRepo.findById(changeDto.getUserId()).orElseThrow(() -> {
			logger.warn("User not found with ID: {}", changeDto.getUserId());
			return new BusinessException(
					messageService.getMessage("MSG001_USER_NOT_FOUND", new Object[] { changeDto.getUserId() }),
					HttpStatus.NOT_FOUND);
		});
		UserAuth userAuth = userAuthRepo.findByUserAuthId(admin.getUserAuth().getUserAuthId()).orElseThrow(() -> {
			logger.warn("UserAuth not found for ID: {}", admin.getUserAuth().getUserAuthId());
			return new BusinessException(messageService.getMessage("MSG004_USER_AUTH_NOT_FOUND",
					new Object[] { admin.getUserAuth().getUserAuthId() }), HttpStatus.NOT_FOUND);
		});

		if (!passwordEncoder.matches(changeDto.getOldPassword(), userAuth.getPassword())) {
			logger.warn("Old password mismatch for user: {}", admin.getUserName());
			throw new BusinessException(messageService.getMessage("MSG020_OLD_PASSWORD_INCORRECT"),
					HttpStatus.UNAUTHORIZED);
		}

		if (!changeDto.getNewPassword().equals(changeDto.getConfirmPassword())) {
			logger.warn("New and confirm passwords do not match for user: {}", admin.getUserName());
			throw new BusinessException(messageService.getMessage("MSG018_PASSWORD_MISMATCH"), HttpStatus.BAD_REQUEST);
		}
		String encodedNewPassword = passwordEncoder.encode(changeDto.getNewPassword());
		userAuth.setPassword(encodedNewPassword);
		userAuth.setFirstLogin(false);
		userAuthRepo.save(userAuth);

		logger.info("Password changed successfully for user: {}", admin.getUserName());

		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG019_PASSWORD_CHANGE_SUCCESS"), HttpStatus.OK.value(), null,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);

	}

	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> forgotPassword(String email) {
		logger.info("Forgot pasword request received for email: {}", email);

		// validate email
		Map<String, Object> dataMap = validateEmailAndSetToken(email);
		sendEmail(email, dataMap);
		logger.info("OTP sent over email: {}", email);

		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG023_FORGOT_PASSWORD_OTP_SUCCESS"), HttpStatus.OK.value(), null,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);

	}

	private Map<String, Object> validateEmailAndSetToken(String email) {
		Map<String, Object> dataAuthAndUser = validateUser(email);

		// generate OTP
		int otpValue = 100000 + new SecureRandom().nextInt(900000);
		String otp = String.valueOf(otpValue);

		// set expiry for 5 min
		LocalDateTime expiry = LocalDateTime.now().plusMinutes(OTP_EXPIRY);
		
		logger.info("Generated OTP and set expiry for 5min");

		// Delete existing OTP for user if any
		System.out.println("deleting existing");
		logger.info("Delete existing otp if exists");
		UserAuth userAuth = (UserAuth) dataAuthAndUser.get("userAuth");
		otpRepository.deleteByUserAuthId(userAuth.getUserAuthId()); 

		// Save new OTP to db
		PasswordResetOtp otpEntity = new PasswordResetOtp();
		otpEntity.setOtp(otp);
		otpEntity.setExpiryTime(expiry);
		otpEntity.setUser(userAuth);
		otpEntity.setEmail(email);
		otpRepository.save(otpEntity);
		logger.info("OTP entity saved");
		
		Map<String, Object> data = new HashMap<>();
		data.put("otp", otp);
		ShopUser shopUser = (ShopUser) dataAuthAndUser.get("shopUser");
		data.put("name", shopUser.getFullName());

		return data;

	}
	private Map<String, Object> validateUser(String email) {
		logger.info("starting validation of email: {}", email);
		UserAuth userAuth = userAuthRepo.findByEmail(email).orElseThrow(() -> {
			logger.warn("User authenitication not found for: {}", email);
			return new BusinessException(messageService.getMessage("MSG027_AUTHENTICATED_USER_NOT_FOUND"), HttpStatus.INTERNAL_SERVER_ERROR);
		});

		ShopUser shopUser = adminRepo.findByUserAuth(userAuth).orElseThrow(() -> {
			logger.warn("Shop User not found for: {}", email);
			return new BusinessException(messageService.getMessage("MSG001_USER_NOT_FOUND", new Object[] { email }), HttpStatus.BAD_REQUEST);
		});
		logger.info("Validation succesfull for {}", email);
		
		
		Map<String, Object> dataAuthAndUser = new HashMap<>();
		dataAuthAndUser.put("userAuth", userAuth);
		dataAuthAndUser.put("shopUser", shopUser);
		return dataAuthAndUser;
		
	}

	private void sendEmail(String email, Map<String, Object> dataMap) {
		// email service
		Map<String, Object> model = new HashMap<>();
		model.put("otp", dataMap.get("otp"));
		model.put("name", dataMap.get("name"));		

		emailService.sendTemplatedEmail(email, OTP_REQUEST_EMAIL_SUBJECT, model, "otp-email.ftl", null);
		logger.info("OTP sent to email: {}", email);
	}
	
	@Transactional(rollbackOn = Exception.class)
	public ResponseEntity<ApiResponse<String>> updateForgotPassword(ForgotPasswordDto forgotPasswordDto) {
		
		logger.info("Received reset password request for: {}", forgotPasswordDto.getEmail());
		
		Map<String, Object> shopUserAndAuth = validateUser(forgotPasswordDto.getEmail());
		
		PasswordResetOtp passwordResetOtp = otpRepository.findByEmail(forgotPasswordDto.getEmail()).orElseThrow(() -> {
			logger.warn("User authenitication not found for: {}", forgotPasswordDto.getEmail());
			return new BusinessException("User not found. Please input correct email.", HttpStatus.BAD_REQUEST);
		});
		
		if(passwordResetOtp.getOtp() != passwordResetOtp.getOtp()) {
			logger.warn("OTP does not match. for: ", forgotPasswordDto.getEmail());
			throw new BusinessException("OTP does not match. Please enter valid OTP", HttpStatus.BAD_REQUEST);
		}	
		
		UserAuth userAuth = (UserAuth) shopUserAndAuth.get("userAuth");
		String encodedNewPassword = passwordEncoder.encode(forgotPasswordDto.getNewPassword());
		userAuth.setPassword(encodedNewPassword);
		userAuthRepo.save(userAuth);
		
		logger.info("Reset password successfully for: {}", forgotPasswordDto.getEmail());
		ApiResponse<String> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG019_PASSWORD_CHANGE_SUCCESS"), HttpStatus.OK.value(), null,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);
		
	}
	
	

}
