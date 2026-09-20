package com.management.service;

import org.springframework.http.ResponseEntity;
import com.management.dto.ApiResponse;
import com.management.dto.MaterialRequestDto;
import com.management.dto.MaterialTransactionRequestDto;

public interface MaterialService {
    ResponseEntity<ApiResponse<String>> registerMaterial(MaterialRequestDto materialRequestDto);
    
    ResponseEntity<ApiResponse<String>> recordMaterialTransaction(MaterialTransactionRequestDto request);
}
