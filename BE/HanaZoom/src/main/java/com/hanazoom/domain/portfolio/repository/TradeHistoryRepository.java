package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.entity.Account;
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
    Page<TradeHistory> findByAccount(Account account, Pageable pageable);

    // 계좌의 특정 종목 거래 내역 조회
    List<TradeHistory> findByAccountAndStockSymbol(Account account, String stockSymbol);

    // 계좌의 특정 기간 거래 내역 조회
    @Query("SELECT th FROM TradeHistory th WHERE th.account = :account AND th.tradeDate BETWEEN :startDate AND :endDate ORDER BY th.tradeDate DESC, th.tradeTime DESC")
    List<TradeHistory> findByAccountAndDateRange(
            @Param("account") Account account,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 계좌의 당일 거래 내역 조회
    List<TradeHistory> findByAccountAndTradeDate(Account account, LocalDate tradeDate);

    // 계좌의 특정 거래 타입 내역 조회
    List<TradeHistory> findByAccountAndTradeType(Account account, TradeType tradeType);

    // 계좌의 최근 거래 내역 조회 (최신순)
    @Query("SELECT th FROM TradeHistory th WHERE th.account = :account ORDER BY th.tradeDate DESC, th.tradeTime DESC")
    List<TradeHistory> findRecentTradesByAccount(@Param("account") Account account);

    // 특정 종목의 모든 거래 내역 조회
    List<TradeHistory> findByStockSymbol(String stockSymbol);

    // 거래 금액이 특정 금액 이상인 거래 내역 조회
    @Query("SELECT th FROM TradeHistory th WHERE th.account = :account AND th.totalAmount >= :minAmount ORDER BY th.tradeDate DESC")
    List<TradeHistory> findByAccountAndMinAmount(
            @Param("account") Account account,
            @Param("minAmount") java.math.BigDecimal minAmount);

    // 계좌의 총 거래 횟수 조회
    @Query("SELECT COUNT(th) FROM TradeHistory th WHERE th.account = :account")
    long countByAccount(@Param("account") Account account);

    // 계좌의 특정 기간 총 거래 금액 조회
    @Query("SELECT COALESCE(SUM(th.totalAmount), 0) FROM TradeHistory th WHERE th.account = :account AND th.tradeDate BETWEEN :startDate AND :endDate")
    java.math.BigDecimal findTotalTradeAmountByAccountAndDateRange(
            @Param("account") Account account,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 계좌의 모든 거래 내역 조회 (최신순)
    List<TradeHistory> findByAccountOrderByTradeDateDescTradeTimeDesc(Account account);
}
