package com.management.service.impl;

import com.management.dto.ApiResponse;
import com.management.dto.MaterialRequestDto;
import com.management.dto.MaterialTransactionRequestDto;
import com.management.entity.*;
import com.management.exception.BusinessException;
import com.management.repo.AdminRepo;
import com.management.repo.MaterialRepository;
import com.management.repo.MaterialTransactionRepository;
import com.management.repo.ShopInfoRepo;
import com.management.repo.UserAuthRepo;
import com.management.service.MaterialService;
import com.management.service.impl.MessageService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialServiceImpl implements MaterialService {

	@Autowired
    private final MaterialRepository materialRepository;
	
	@Autowired
    private final MaterialTransactionRepository transactionRepository;
	
	@Autowired
    private final ShopInfoRepo shopInfoRepo;
	
	@Autowired
    private final UserAuthRepo userAuthRepo;
	
	@Autowired
    private final AdminRepo adminRepo;
	
	@Autowired
    private final MessageService messageService;

    @Override
    @Transactional
    public ResponseEntity<ApiResponse<String>> registerMaterial(MaterialRequestDto materialRequestDto) {
        log.info("Starting material registration for: {}", materialRequestDto.getName());

        // Check if material with same name already exists
        String materialName = materialRequestDto.getName();
        if (materialRepository.existsByName(materialName)) {
            String errorMessage = messageService.getMessage("MSG049_MATERIAL_EXISTS", new Object[] { materialName });
            log.warn("Failed to register material - {}", errorMessage);
            throw new BusinessException(errorMessage, HttpStatus.BAD_REQUEST);
        }

        // Map DTO to entity and save
        Material material = new Material();
        material.setName(materialRequestDto.getName());
        material.setCost(materialRequestDto.getCost());
        material.setDescription(materialRequestDto.getDescription());
        
        Material savedMaterial = materialRepository.save(material);
        log.debug("Material saved successfully with ID: {}", savedMaterial.getMaterialId());
        
        String successMessage = messageService.getMessage("MSG054_MATERIAL_REGISTERED", 
                new Object[]{material.getName()});
                
        return new ResponseEntity<ApiResponse<String>>(
            new ApiResponse<String>(true, successMessage, HttpStatus.OK.value(), null, LocalDateTime.now()),
            HttpStatus.OK
        );
    }
    
    @Override
    @Transactional
    public ResponseEntity<ApiResponse<String>> recordMaterialTransaction(MaterialTransactionRequestDto request) {
        log.info("Starting material transaction for material ID: {}, shop ID: {}", 
                request.getMaterialId(), request.getShopId());
        
        // Validate and get the material
        Material material = materialRepository.findById(request.getMaterialId().intValue())
                .orElseThrow(() -> {
                    String errorMsg = messageService.getMessage("MSG050_MATERIAL_NOT_FOUND", 
                            new Object[]{request.getMaterialId()});
                    log.warn("Material not found - {}", errorMsg);
                    return new BusinessException(errorMsg, HttpStatus.NOT_FOUND);
                });
        
        // Validate and get the shop
        ShopInfo shop = shopInfoRepo.findById(request.getShopId().intValue())
                .orElseThrow(() -> {
                    String errorMsg = messageService.getMessage("MSG051_SHOP_NOT_FOUND", 
                            new Object[]{request.getShopId()});
                    log.warn("Shop not found - {}", errorMsg);
                    return new BusinessException(errorMsg, HttpStatus.NOT_FOUND);
                });
        
        // Get the current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserAuth userAuth = userAuthRepo.findByEmail(username)
                .orElseThrow(() -> {
                    String errorMsg = messageService.getMessage("MSG001_USER_NOT_FOUND", 
                            new Object[]{username});
                    log.warn("User not found - {}", errorMsg);
                    return new UsernameNotFoundException(errorMsg);
                });
        
        // Fetch the ShopUser record using the UserAuth
        ShopUser recordedBy = adminRepo.findByUserAuth(userAuth)
                .orElseThrow(() -> {
                    String errorMsg = messageService.getMessage("MSG053_SHOP_USER_NOT_FOUND", 
                            new Object[]{userAuth.getEmail()});
                    log.warn("ShopUser not found for UserAuth {} - {}", userAuth.getEmail(), errorMsg);
                    return new BusinessException(errorMsg, HttpStatus.NOT_FOUND);
                });
        
        // Create and save the transaction
        MaterialTransaction transaction = new MaterialTransaction();
        transaction.setMaterial(material);
        transaction.setShop(shop);
        transaction.setQuantity(request.getQuantity());
        transaction.setNote(request.getNote());
        transaction.setRecordedBy(recordedBy);
        
        transactionRepository.save(transaction);
        
        log.info("Successfully recorded material transaction with ID: {}", transaction.getRecordId());
        
        String successMsg = messageService.getMessage("MSG053_TRANSACTION_RECORDED", 
                new Object[]{

                    transaction.getQuantity(),
                    material.getName(),
                    shop.getShopName()
                });
                
        return new ResponseEntity<ApiResponse<String>>(
            new ApiResponse<String>(true, successMsg, HttpStatus.OK.value(), null, LocalDateTime.now()),
            HttpStatus.OK
        );
    }
    
    public ResponseEntity<ApiResponse<Map<Integer, String>>> getMateialList() {
//		logger.info("Get all usernames request received");

		Map<Integer, String> allMaterial = getMaterial();

		if (allMaterial == null || allMaterial.isEmpty()) {
			log.warn("No material found in the system.");
		}

//		logger.debug("Shop name and Id {}", allShopNamesAndId);

		ApiResponse<Map<Integer, String>> apiResponse = new ApiResponse<>(true,
				messageService.getMessage("MSG055_ALL_USERNAMES_LIST"), HttpStatus.OK.value(), allMaterial,
				LocalDateTime.now());
		return new ResponseEntity<ApiResponse<Map<Integer, String>>>(apiResponse, HttpStatus.OK);
	}
    
    private Map<Integer, String> getMaterial() {
		List<Material> results = materialRepository.findAll();

		 return results.stream()
		            .collect(Collectors.toMap(Material::getMaterialId, Material::getName));
	}
}
