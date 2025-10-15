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


    Optional<AccountBalance> findByAccountIdAndBalanceDate(Long accountId, LocalDate balanceDate);


    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findLatestBalanceByAccountId(@Param("accountId") Long accountId);


    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    Optional<AccountBalance> findLatestBalanceByAccountIdOrderByDateDesc(@Param("accountId") Long accountId);


    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId AND ab.balanceDate BETWEEN :startDate AND :endDate ORDER BY ab.balanceDate")
    List<AccountBalance> findBalanceByAccountIdAndDateRange(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("SELECT ab FROM AccountBalance ab WHERE ab.accountId = :accountId ORDER BY ab.balanceDate DESC")
    List<AccountBalance> findAllBalanceByAccountIdOrderByDateDesc(@Param("accountId") Long accountId);


    List<AccountBalance> findByBalanceDate(LocalDate balanceDate);
}
