package com.management.service.impl;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.management.dto.ApiResponse;
import com.management.dto.LoginDto;
import com.management.dto.LoginResponseDto;
import com.management.entity.ShopUser;
import com.management.entity.UserAuth;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.UserAuthRepo;
import com.management.service.LoginService;
import com.management.util.JwtUtil;

@Service
public class LoginAdminServiceImpl implements LoginService<LoginDto> {

	private static final Logger logger = LoggerFactory.getLogger(LoginAdminServiceImpl.class);
	
	@Autowired
	private AdminRepo adminRepo;

	@Autowired
	UserAuthRepo userAuthRepo;

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private MessageService messageService;

	@Override
	public ResponseEntity<ApiResponse<LoginResponseDto>> processLogin(LoginDto loginDto) {
		
		logger.info("Login request received for: {}", loginDto.getUserName());	

		ShopUser admin = adminRepo.findByUserName(loginDto.getUserName())
				.orElseThrow(() -> {
			        logger.warn("Login failed: user '{}' not found", loginDto.getUserName());
			        return new BusinessException(
			            messageService.getMessage("MSG001_USER_NOT_FOUND", new Object[] { loginDto.getUserName() }),
			            HttpStatus.NOT_FOUND
			        );
			    });
		UserAuth userAuth = userAuthRepo.findByUserAuthId(admin.getUserAuth().getUserAuthId())
				.orElseThrow(() ->{
			        logger.warn("Login failed: UserAuth not found for user '{}'", loginDto.getUserName());
			        return new BusinessException(
			            messageService.getMessage("MSG004_USER_AUTH_NOT_FOUND", new Object[] { loginDto.getUserName() }),
			            HttpStatus.NOT_FOUND
			        );
			    });

		if (!passwordEncoder.matches(loginDto.getPassword(), userAuth.getPassword())) {
			logger.warn("Login failed: password does not match for user '{}'", loginDto.getUserName());
			throw new BusinessException(
					messageService.getMessage("MSG003_INVALID_PASSWORD", new Object[] { loginDto.getUserName() }),
					HttpStatus.UNAUTHORIZED);
		}

		String token = jwtUtil.generateToken(userAuth.getEmail(), userAuth.getRole(), admin.getAdminId());

		LoginResponseDto loginResponseDto = LoginResponseDto.builder().token(token).userName(admin.getUserName())
				.role(userAuth.getRole()).adminId(admin.getAdminId()).firstLogin(userAuth.isFirstLogin()).build();

		ApiResponse<LoginResponseDto> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG005_LOGIN_SUCCESS", new Object[] { userAuth.getRole(), admin.getUserName() }),
				HttpStatus.OK.value(), loginResponseDto, LocalDateTime.now());
		logger.info("User Logged in successfully");
		return new ResponseEntity<ApiResponse<LoginResponseDto>>(apiResponse, HttpStatus.OK);
	}

}
