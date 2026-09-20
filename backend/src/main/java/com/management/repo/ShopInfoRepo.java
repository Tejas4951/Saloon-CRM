package com.management.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.management.entity.ShopInfo;

public interface ShopInfoRepo extends JpaRepository<ShopInfo, Integer>  {
	
	Optional<ShopInfo> findByShopName(String ShopName);
	
	@Query("SELECT s.shopId, s.shopName FROM ShopInfo s")
	List<Object[]> findAllShopIdAndName();
	
	Optional<ShopInfo> findByShopId(Integer shopId);


}
