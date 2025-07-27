package com.hanazoom.domain.region_stock.repository;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegionStockRepository extends JpaRepository<RegionStock, Long> {

    @Modifying
    @Query("DELETE FROM RegionStock rs WHERE rs.dataDate = :date")
    void deleteAllByDataDate(LocalDate date);

    List<RegionStock> findAllByDataDate(LocalDate date);

    Optional<RegionStock> findByRegionAndStock(Region region, Stock stock);
}