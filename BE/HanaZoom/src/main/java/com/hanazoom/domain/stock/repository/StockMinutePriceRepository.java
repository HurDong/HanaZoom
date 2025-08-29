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

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (최신순)
     */
    @Query("SELECT s FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "ORDER BY s.timestamp DESC")
    List<StockMinutePrice> findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (시간 범위 지정)
     */
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

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (최근 N개)
     */
    @Query("SELECT s FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "ORDER BY s.timestamp DESC")
    List<StockMinutePrice> findTopNByStockSymbolAndMinuteIntervalOrderByTimestampDesc(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    /**
     * 특정 종목의 특정 분봉 간격 데이터 개수 조회
     */
    @Query("SELECT COUNT(s) FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval")
    long countByStockSymbolAndMinuteInterval(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval);

    /**
     * 특정 종목의 특정 분봉 간격 데이터 삭제 (오래된 데이터)
     */
    @Query("DELETE FROM StockMinutePrice s " +
           "WHERE s.stockSymbol = :stockSymbol " +
           "AND s.minuteInterval = :minuteInterval " +
           "AND s.timestamp < :cutoffTime")
    void deleteOldData(
            @Param("stockSymbol") String stockSymbol,
            @Param("minuteInterval") StockMinutePrice.MinuteInterval minuteInterval,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 특정 종목의 모든 분봉 데이터 삭제
     */
    void deleteByStockSymbol(String stockSymbol);

    /**
     * 특정 시간 이전의 모든 분봉 데이터 삭제
     */
    void deleteByTimestampBefore(LocalDateTime timestamp);
}
