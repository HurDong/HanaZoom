package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.Account;
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
    Optional<AccountBalance> findByAccountAndBalanceDate(Account account, LocalDate balanceDate);

    // 계좌의 최신 잔고 조회
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.account = :account ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findLatestBalanceByAccount(@Param("account") Account account);

    // 계좌의 최신 잔고 조회 (가장 최근)
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.account = :account ORDER BY ab.balanceDate DESC")
    Optional<AccountBalance> findLatestBalanceByAccountOrderByDateDesc(@Param("account") Account account);

    // 계좌의 특정 기간 잔고 조회
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.account = :account AND ab.balanceDate BETWEEN :startDate AND :endDate ORDER BY ab.balanceDate")
    List<AccountBalance> findBalanceByAccountAndDateRange(
            @Param("account") Account account,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 계좌의 모든 잔고 내역 조회 (최신순)
    @Query("SELECT ab FROM AccountBalance ab WHERE ab.account = :account ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findAllBalanceByAccountOrderByDateDesc(@Param("account") Account account);

    // 특정 날짜의 모든 계좌 잔고 조회
    List<AccountBalance> findByBalanceDate(LocalDate balanceDate);
}
