package com.management.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.management.dto.ApiResponse;
import com.management.dto.ShopUserResponseDto;
import com.management.dto.ShopUserUpdateRequestDto;
import com.management.dto.ShopUserResponseDto;
import com.management.dto.UserInfoDto;
import com.management.service.impl.AdminDashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AdminDashboardController {
	
	@Autowired
	private AdminDashboardService adminDashboardService;
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_ADMIN)")
	@GetMapping("/all-staff")
    public ResponseEntity<ApiResponse<String>> getAllStaffNames(@RequestParam Integer adminId) {
		
		 ApiResponse<String> apiResponse = new ApiResponse<>(
					true, "Dash accessed successfully", HttpStatus.OK.value(), "Dashboard Accessed...!", LocalDateTime.now());
			return new ResponseEntity<ApiResponse<String>>(apiResponse, HttpStatus.OK);
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@GetMapping("/getallusernames")
    public ResponseEntity<ApiResponse<List<String>>> getAllUserNames() {
		
		 return adminDashboardService.getAllUserNames();
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@GetMapping("/getallshops")
    public ResponseEntity<ApiResponse<Map<Integer, String>>> getAllUserShops() {
		
		 return adminDashboardService.getAllShops();
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleAvailability(@PathVariable("id") Integer shopId) {
		
		 return adminDashboardService.toggleShop(shopId);
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@GetMapping("/users/by-role")
	public ResponseEntity<ApiResponse<List<UserInfoDto>>> getUsersByRole(
	        @RequestParam String role,
	        @RequestParam Integer shopId) {
		
		return adminDashboardService.getUserInfoByRole(role, shopId);
	}
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@DeleteMapping("/deleteuser/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUserById(@PathVariable Integer userId) {

		return adminDashboardService.deleteUserById(userId); 
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@GetMapping("/getuser/{userId}")
	public ResponseEntity<ApiResponse<ShopUserResponseDto>> getUser(@PathVariable Integer userId) {

		return adminDashboardService.getUserDetails(userId); 
        
    }
	
	@PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@PostMapping("/shop-users/update-role-shop")
    public ResponseEntity<ApiResponse<String>> updateUser(@RequestBody ShopUserUpdateRequestDto shopUserUpdateRequestDto) {

		return adminDashboardService.updateUserRoleAndShop(shopUserUpdateRequestDto);
        
    }

}
