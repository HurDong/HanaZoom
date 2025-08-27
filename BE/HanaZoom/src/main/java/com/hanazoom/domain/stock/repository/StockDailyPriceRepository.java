package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.entity.StockDailyPrice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockDailyPriceRepository extends JpaRepository<StockDailyPrice, Long> {

    @Query("SELECT s FROM StockDailyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.tradeDate DESC")
    List<StockDailyPrice> findByStockSymbolOrderByTradeDateDesc(@Param("stockSymbol") String stockSymbol);

    @Query("SELECT s FROM StockDailyPrice s WHERE s.stockSymbol = :stockSymbol AND s.tradeDate BETWEEN :startDate AND :endDate ORDER BY s.tradeDate ASC")
    List<StockDailyPrice> findByStockSymbolAndTradeDateBetweenOrderByTradeDateAsc(
            @Param("stockSymbol") String stockSymbol,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM StockDailyPrice s WHERE s.stockSymbol = :stockSymbol ORDER BY s.tradeDate DESC")
    List<StockDailyPrice> findTopByStockSymbolOrderByTradeDateDesc(@Param("stockSymbol") String stockSymbol,
            Pageable pageable);
}
