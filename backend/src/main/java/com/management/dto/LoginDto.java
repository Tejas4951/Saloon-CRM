package com.management.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginDto {

    private String userName;
    private String password;

}
