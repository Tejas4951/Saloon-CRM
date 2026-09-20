package com.management.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.management.entity.ServiceInfo;
import com.management.entity.ServiceInfo.Gender;

@Repository
public interface ServiceInfoRepo extends JpaRepository<ServiceInfo, Integer> {
	
	Optional<ServiceInfo> findByServiceId(Integer serviceId);
	
	Optional<ServiceInfo> findByServiceNameAndGenderApplicableAndShop_ShopId(String serviceName, Gender gender, Integer shopId);


}
