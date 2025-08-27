package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.entity.StockWeeklyPrice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockWeeklyPriceRepository extends JpaRepository<StockWeeklyPrice, Long> {

    @Query("SELECT s FROM StockWeeklyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.weekStartDate DESC")
    List<StockWeeklyPrice> findByStockSymbolOrderByWeekStartDateDesc(@Param("stockSymbol") String stockSymbol);

    @Query("SELECT s FROM StockWeeklyPrice s WHERE s.stockSymbol = :stockSymbol AND s.weekStartDate BETWEEN :startDate AND :endDate ORDER BY s.weekStartDate ASC")
    List<StockWeeklyPrice> findByStockSymbolAndWeekStartDateBetweenOrderByWeekStartDateAsc(
            @Param("stockSymbol") String stockSymbol,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM StockWeeklyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.weekStartDate DESC")
    List<StockWeeklyPrice> findTopByStockSymbolOrderByWeekStartDateDesc(@Param("stockSymbol") String stockSymbol,
            Pageable pageable);
}
