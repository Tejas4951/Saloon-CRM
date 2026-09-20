package com.management.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ApiResponse<T> {
	private boolean success;
	private String message;
    private int statusCode; 
    private T data;
    private LocalDateTime timestamp;
    private String error;
    
    
	public ApiResponse(boolean success, String message, int statusCode, T data, LocalDateTime timestamp) {
		this.success = success;
		this.message = message;
		this.statusCode = statusCode;
		this.data = data;
		this.timestamp = timestamp;
	}
	
	public ApiResponse(boolean success, String message, int statusCode, T data, LocalDateTime timestamp, String error) {
		this.success = success;
		this.message = message;
		this.statusCode = statusCode;
		this.error = error;
		this.data = data;
		this.timestamp = timestamp;
		
	}
	
}
