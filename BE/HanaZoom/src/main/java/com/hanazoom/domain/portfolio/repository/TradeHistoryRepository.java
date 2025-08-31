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

        // 계좌의 모든 거래 내역 조회
        Page<TradeHistory> findByAccountId(Long accountId, Pageable pageable);

        // 계좌의 특정 종목 거래 내역 조회
        List<TradeHistory> findByAccountIdAndStockSymbol(Long accountId, String stockSymbol);

        // 계좌의 특정 기간 거래 내역 조회
        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId AND th.tradeDate BETWEEN :startDate AND :endDate ORDER BY th.tradeDate DESC, th.tradeTime DESC")
        List<TradeHistory> findByAccountIdAndDateRange(
                        @Param("accountId") Long accountId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        // 계좌의 당일 거래 내역 조회
        List<TradeHistory> findByAccountIdAndTradeDate(Long accountId, LocalDate tradeDate);

        // 계좌의 특정 거래 타입 내역 조회
        List<TradeHistory> findByAccountIdAndTradeType(Long accountId, TradeType tradeType);

        // 계좌의 최근 거래 내역 조회 (최신순)
        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId ORDER BY th.tradeDate DESC, th.tradeTime DESC")
        List<TradeHistory> findRecentTradesByAccountId(@Param("accountId") Long accountId);

        // 특정 종목의 모든 거래 내역 조회
        List<TradeHistory> findByStockSymbol(String stockSymbol);

        // 거래 금액이 특정 금액 이상인 거래 내역 조회
        @Query("SELECT th FROM TradeHistory th WHERE th.accountId = :accountId AND th.totalAmount >= :minAmount ORDER BY th.tradeDate DESC")
        List<TradeHistory> findByAccountIdAndMinAmount(
                        @Param("accountId") Long accountId,
                        @Param("minAmount") java.math.BigDecimal minAmount);

        // 계좌의 총 거래 횟수 조회
        @Query("SELECT COUNT(th) FROM TradeHistory th WHERE th.accountId = :accountId")
        long countByAccountId(@Param("accountId") Long accountId);

        // 계좌의 특정 기간 총 거래 금액 조회
        @Query("SELECT COALESCE(SUM(th.totalAmount), 0) FROM TradeHistory th WHERE th.accountId = :accountId AND th.tradeDate BETWEEN :startDate AND :endDate")
        java.math.BigDecimal findTotalTradeAmountByAccountIdAndDateRange(
                        @Param("accountId") Long accountId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        // 계좌의 모든 거래 내역 조회 (최신순)
        List<TradeHistory> findByAccountIdOrderByTradeDateDescTradeTimeDesc(Long accountId);
}
