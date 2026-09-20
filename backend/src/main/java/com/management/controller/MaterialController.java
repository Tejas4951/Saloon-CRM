package com.management.controller;

import com.management.dto.ApiResponse;
import com.management.dto.MaterialRequestDto;
import com.management.dto.MaterialTransactionRequestDto;
import com.management.service.impl.MaterialServiceImpl;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MaterialController {

	@Autowired
    private final MaterialServiceImpl materialService;

    @PostMapping("register/material")
    @PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<String>> registerMaterial(
            @Valid @RequestBody MaterialRequestDto materialRequestDto) {
        return materialService.registerMaterial(materialRequestDto);
    }
    
    @PostMapping("material/transactions")
    @PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<String>> recordTransaction(
            @Valid @RequestBody MaterialTransactionRequestDto transactionRequest) {
        return materialService.recordMaterialTransaction(transactionRequest);
    }
    
    @PreAuthorize("hasRole(T(com.management.constant.Constants).ROLE_SUPER_ADMIN)")
	@GetMapping("/getmateriallist")
    public ResponseEntity<ApiResponse<Map<Integer, String>>> getMaterial() {
		
		 return materialService.getMateialList();
        
    }
}
