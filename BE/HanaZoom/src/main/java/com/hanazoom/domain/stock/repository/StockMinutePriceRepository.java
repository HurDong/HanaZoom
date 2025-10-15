package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.entity.StockMinutePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMinutePriceRepository extends JpaRepository<StockMinutePrice, Long> {

    @Query("SELECT s FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "ORDER BY s.timestamp DESC")
    List<StockMinutePrice> findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    @Query("SELECT s FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "AND s.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY s.timestamp ASC")
    List<StockMinutePrice> findByStockSymbolAndMinuteIntervalAndTimestampBetween(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT s FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "ORDER BY s.timestamp DESC")
    List<StockMinutePrice> findTopNByStockSymbolAndMinuteIntervalOrderByTimestampDesc(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    @Query("SELECT COUNT(s) FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval")
    long countByStockSymbolAndMinuteInterval(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    @Query("DELETE FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "AND s.timestamp < :cutoffTime")
    void deleteOldData(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    void deleteByStockSymbol(String stockSymbol);

    void deleteByTimestampBefore(LocalDateTime timestamp);
}

