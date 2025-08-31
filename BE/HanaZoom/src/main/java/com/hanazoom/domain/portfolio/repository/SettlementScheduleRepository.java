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

    // 계좌 잔고의 모든 정산 일정 조회
    List<SettlementSchedule> findByAccountBalance(AccountBalance accountBalance);

    // 특정 날짜에 정산 완료될 스케줄들 조회
    List<SettlementSchedule> findBySettlementDateAndStatus(LocalDate settlementDate, SettlementStatus status);

    // 정산 대기 중인 스케줄들 조회
    List<SettlementSchedule> findByStatus(SettlementStatus status);

    // 계좌 잔고의 정산 대기 중인 스케줄들 조회
    List<SettlementSchedule> findByAccountBalanceAndStatus(AccountBalance accountBalance, SettlementStatus status);

    // 특정 기간의 정산 일정 조회
    @Query("SELECT ss FROM SettlementSchedule ss WHERE ss.settlementDate BETWEEN :startDate AND :endDate")
    List<SettlementSchedule> findBySettlementDateBetween(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 특정 거래 내역의 정산 일정 조회
    SettlementSchedule findByTradeHistoryId(Long tradeHistoryId);

    // 오늘 정산 완료될 스케줄들 조회
    @Query("SELECT ss FROM SettlementSchedule ss WHERE ss.settlementDate = :today AND ss.status = 'PENDING'")
    List<SettlementSchedule> findTodaySettlements(@Param("today") LocalDate today);

    // 정산 대기 중인 총 금액 조회
    @Query("SELECT COALESCE(SUM(ss.settlementAmount), 0) FROM SettlementSchedule ss WHERE ss.accountBalance = :accountBalance AND ss.status = 'PENDING'")
    BigDecimal findTotalPendingSettlementAmount(@Param("accountBalance") AccountBalance accountBalance);
}
