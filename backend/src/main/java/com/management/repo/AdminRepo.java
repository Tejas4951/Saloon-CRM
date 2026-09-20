package com.management.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.management.entity.ShopUser;
import com.management.entity.UserAuth;

public interface AdminRepo extends JpaRepository<ShopUser, Integer> {
	
	
//	Optional<Admin> findByEmail(String email);
//	Optional<Admin> findByName(String email);
	
	public Optional<ShopUser> findByUserName(String userName);
	
	public boolean existsByUserName(String userName);
	
	public Optional<ShopUser> findByAdminId(Integer adminId);
	
	@Query("SELECT s.userName FROM ShopUser s")
    public List<String> getAllByUserNames();
	
	@EntityGraph(attributePaths = "userAuth")
	Optional<ShopUser> findByUserAuth(UserAuth userAuth);
	
	@Query("SELECT u FROM ShopUser u JOIN FETCH u.userAuth ua WHERE u.shop.shopId = :shopId")
	List<ShopUser> findAllByShopId(@Param("shopId") Integer shopId);


	
}
