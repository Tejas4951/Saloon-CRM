package com.management.repo;

import com.management.entity.MaterialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialTransactionRepository extends JpaRepository<MaterialTransaction, Long> {
    
    List<MaterialTransaction> findByMaterial_MaterialIdOrderByRecordedAtDesc(Long materialId);
    
    List<MaterialTransaction> findByShop_ShopIdOrderByRecordedAtDesc(Long shopId);
    
    List<MaterialTransaction> findByMaterial_MaterialIdAndShop_ShopIdOrderByRecordedAtDesc(Long materialId, Long shopId);
}
