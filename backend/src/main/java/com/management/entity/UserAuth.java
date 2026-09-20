package com.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class UserAuth {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer userAuthId;
	
	@Column(nullable = false, unique = true, length = 100)
    private String email;
	
    @Column(nullable = false, length = 255)
    private String password;
    
    @Column(nullable = false, length = 50)
    private String role;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(nullable = false)
    private boolean firstLogin = true;

}
