package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.entity.StockMonthlyPrice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockMonthlyPriceRepository extends JpaRepository<StockMonthlyPrice, Long> {

    @Query("SELECT s FROM StockMonthlyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.yearMonth DESC")
    List<StockMonthlyPrice> findByStockSymbolOrderByYearMonthDesc(@Param("stockSymbol") String stockSymbol);

    @Query("SELECT s FROM StockMonthlyPrice s WHERE s.stockSymbol = :stockSymbol AND s.yearMonth BETWEEN :startMonth AND :endMonth ORDER BY s.yearMonth ASC")
    List<StockMonthlyPrice> findByStockSymbolAndYearMonthBetweenOrderByYearMonthAsc(
            @Param("stockSymbol") String stockSymbol,
            @Param("startMonth") String startMonth,
            @Param("endMonth") String endMonth);

    @Query("SELECT s FROM StockMonthlyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.yearMonth DESC")
    List<StockMonthlyPrice> findTopByStockSymbolOrderByYearMonthDesc(@Param("stockSymbol") String stockSymbol,
            Pageable pageable);
}
