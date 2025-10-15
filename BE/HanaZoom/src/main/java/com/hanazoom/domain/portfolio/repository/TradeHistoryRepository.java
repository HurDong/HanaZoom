package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.entity.TradeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TradeHistoryRepository extends JpaRepository<TradeHistory, Long> {


        Page<TradeHistory> findByAccountId(Long accountId, Pageable pageable);


        List<TradeHistory> findByAccountIdAndStockSymbol(Long accountId, String stockSymbol);


        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId AND th.tradeDate BETWEEN :startDate AND :endDate ORDER BY th.tradeDate DESC, th.tradeTime DESC")
        List<TradeHistory> findByAccountIdAndDateRange(
                        @Param("accountId") Long accountId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);


        List<TradeHistory> findByAccountIdAndTradeDate(Long accountId, LocalDate tradeDate);


        List<TradeHistory> findByAccountIdAndTradeType(Long accountId, TradeType tradeType);


        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId ORDER BY th.tradeDate DESC, th.tradeTime DESC")
        List<TradeHistory> findRecentTradesByAccountId(@Param("accountId") Long accountId);


        List<TradeHistory> findByStockSymbol(String stockSymbol);


        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId AND th.totalAmount >= :minAmount ORDER BY th.tradeDate DESC")
        List<TradeHistory> findByAccountIdAndMinAmount(
                        @Param("accountId") Long accountId,
                        @Param("minAmount") java.math.BigDecimal minAmount);


        @Query("SELECT COUNT(th) FROM TradeHistory th WHERE th.accountId = :accountId")
        long countByAccountId(@Param("accountId") Long accountId);


        @Query("SELECT COALESCE(SUM(th.totalAmount), 0) FROM TradeHistory th WHERE th.accountId = :accountId AND th.tradeDate BETWEEN :startDate AND :endDate")
        java.math.BigDecimal findTotalTradeAmountByAccountIdAndDateRange(
                        @Param("accountId") Long accountId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);


        List<TradeHistory> findByAccountIdOrderByTradeDateDescTradeTimeDesc(Long accountId);
}
