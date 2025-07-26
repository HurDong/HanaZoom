package com.hanazoom.domain.region_stock.repository;

import com.hanazoom.domain.region_stock.entity.RegionStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegionStockRepository extends JpaRepository<RegionStock, Long> {
}