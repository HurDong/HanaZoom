package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.AccountBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountBalanceRepository extends JpaRepository<AccountBalance, Long> {

    // 계좌의 특정 날짜 잔고 조회
    Optional<AccountBalance> findByAccountIdAndBalanceDate(Long accountId, LocalDate balanceDate);

    // 계좌의 최신 잔고 조회
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findLatestBalanceByAccountId(@Param("accountId") Long accountId);

    // 계좌의 최신 잔고 조회 (가장 최근)
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    Optional<AccountBalance> findLatestBalanceByAccountIdOrderByDateDesc(@Param("accountId") Long accountId);

    // 계좌의 특정 기간 잔고 조회
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId AND ab.balanceDate BETWEEN :startDate AND :endDate ORDER BY ab.balanceDate")
    List<AccountBalance> findBalanceByAccountIdAndDateRange(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 계좌의 모든 잔고 내역 조회 (최신순)
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findAllBalanceByAccountIdOrderByDateDesc(@Param("accountId") Long accountId);

    // 특정 날짜의 모든 계좌 잔고 조회
    List<AccountBalance> findByBalanceDate(LocalDate balanceDate);
}
