package com.management.repo;

import com.management.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Integer> {
    // Custom query methods can be added here if needed
    boolean existsByName(String name);
}
