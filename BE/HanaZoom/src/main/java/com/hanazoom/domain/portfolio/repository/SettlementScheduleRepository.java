package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.SettlementSchedule;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.SettlementSchedule.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;

@Repository
public interface SettlementScheduleRepository extends JpaRepository<SettlementSchedule, Long> {


    List<SettlementSchedule> findByAccountBalance(AccountBalance accountBalance);


    List<SettlementSchedule> findBySettlementDateAndStatus(LocalDate settlementDate, SettlementStatus status);


    List<SettlementSchedule> findByStatus(SettlementStatus status);


    List<SettlementSchedule> findByAccountBalanceAndStatus(AccountBalance accountBalance, SettlementStatus status);


    @Query("SELECT ss FROM SettlementSchedule ss WHERE ss.settlementDate BETWEEN :startDate AND :endDate")
    List<SettlementSchedule> findBySettlementDateBetween(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    SettlementSchedule findByTradeHistoryId(Long tradeHistoryId);


    @Query("SELECT ss FROM SettlementSchedule ss WHERE ss.settlementDate = :today AND ss.status = 'PENDING'")
    List<SettlementSchedule> findTodaySettlements(@Param("today") LocalDate today);


    @Query("SELECT COALESCE(SUM(ss.settlementAmount), 0) FROM SettlementSchedule ss WHERE ss.accountBalance = :accountBalance AND ss.status = 'PENDING'")
    BigDecimal findTotalPendingSettlementAmount(@Param("accountBalance") AccountBalance accountBalance);
}
