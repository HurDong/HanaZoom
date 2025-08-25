package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findBySymbol(String symbol);

    List<Stock> findByNameContainingOrSymbolContaining(String name, String symbol);

    List<Stock> findByLogoUrlIsNull();

    List<Stock> findByLogoUrlIsNullOrLogoUrlEquals(String logoUrl);
}