package com.management.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MaterialRequestDto {
    @NotBlank(message = "Material name is required")
    @Size(max = 100, message = "Material name must be less than 100 characters")
    private String name;

    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Cost must be greater than 0")
    private BigDecimal cost;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
}
