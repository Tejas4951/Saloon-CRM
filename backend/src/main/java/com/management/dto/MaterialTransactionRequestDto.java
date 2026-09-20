package com.management.dto;


import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MaterialTransactionRequestDto {
    @NotNull(message = "Material ID is required")
    private Long materialId;
    
    @NotNull(message = "Shop ID is required")
    private Long shopId;
    
    
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be greater than 0")
    private BigDecimal quantity;
    
    @Size(max = 500, message = "Note must be less than 500 characters")
    private String note;
}
