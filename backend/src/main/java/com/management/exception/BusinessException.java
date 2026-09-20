package com.management.exception;
import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException{

	private static final long serialVersionUID = 1L;
	private HttpStatus httpStatus;

	public BusinessException(String message, HttpStatus httpStatus) {
		super(message);
		this.httpStatus = httpStatus;
	}

}