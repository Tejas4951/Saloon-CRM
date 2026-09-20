 package com.management.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.management.entity.UserAuth;

public interface UserAuthRepo extends JpaRepository<UserAuth, Integer> {
	
	Optional<UserAuth> findByUserAuthId(Integer userAuthId);
	Optional<UserAuth> findByEmail(String email);

}
