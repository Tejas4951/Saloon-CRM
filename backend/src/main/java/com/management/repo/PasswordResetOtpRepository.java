package com.management.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.management.entity.PasswordResetOtp;
import com.management.entity.UserAuth;

import jakarta.transaction.Transactional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Integer>  {
	
	public Optional<PasswordResetOtp> findByUser(UserAuth user);
	
    public void deleteByUser(UserAuth user);
    
    public Optional<PasswordResetOtp> findByEmail(String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetOtp o WHERE o.user.userAuthId = :userAuthId")
    void deleteByUserAuthId(@Param("userAuthId") Integer userAuthId);

}
