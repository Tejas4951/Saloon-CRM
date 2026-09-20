package com.management.util;

import io.jsonwebtoken.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.management.constant.Constants;

import java.util.Date;

@Component
public class JwtUtil {
	
	@Value("${jwt.secret}")
	private String jwtSecret;
    

    public String generateToken(String email, String role, Integer adminId) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("adminId", adminId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + Constants.EXPIRATION_TIME))
                //.setExpiration(new Date(System.currentTimeMillis() + 1000))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }
    
    public Long extractUserId(String token) {
        return extractClaims(token).get("adminId", Long.class);
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}